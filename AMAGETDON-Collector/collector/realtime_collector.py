import time
import threading
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Set
from collections import defaultdict
from core.stock_manager import StockManager
from core.token_manager import TokenManager
from utils.logger import logger
from config.config import REDIS_KEYS
from collector.candle_filler import CandleFiller
from utils.kis_api_client import KISApiClient
from models.dto import CandleDTO
from utils.db import get_db_connection, save_candle

class RealtimeCollector:

    def __init__(self, token_manager: TokenManager, stock_manager: StockManager):
        self.token_manager = token_manager
        self.redis_client = token_manager.redis_client
        self.candle_filler = CandleFiller(token_manager)
        self.api_client = KISApiClient(token_manager)
        self.stock_manager = stock_manager
        
        self.running = False
        self.top_stocks_key = REDIS_KEYS['top_10_stocks']
        self.user_stocks_key = REDIS_KEYS['user_stocks']
        
        self.last_fill_time: Dict[str, datetime] = {}
        
        self.current_minute_data: Dict[str, list] = defaultdict(list)
        self.last_candle_created: Dict[str, datetime] = {}

        self.rate_limiter = threading.Semaphore(20)
        self.last_reset = time.time()
        self.call_count = 0
        self.lock = threading.Lock()
        
        self.conn = None

    def connect_db(self):
        self.conn = get_db_connection(self.conn)

    # 초당 20건 제한
    def fetch_with_rate_limit(self, stock_code): 
        with self.lock:
            now = time.time()
            if now - self.last_reset >= 1.0:
                self.call_count = 0
                self.last_reset = now
            
            if self.call_count >= 20:
                sleep_time = 1.0 - (now - self.last_reset)
                if sleep_time > 0:
                    time.sleep(sleep_time)
                self.call_count = 0
                self.last_reset = time.time()
            
            self.call_count += 1
        
        return self.fetch_price(stock_code)

    def collect(self):
        self.running = True 
        rest_thread = threading.Thread(target=self._collect_rest_stocks, daemon=True)
        rest_thread.start()
        
        fill_thread = threading.Thread(target=self._fill_missing_candles, daemon=True)
        fill_thread.start()
        
        logger.info("RealtimeCollector 시작 (REST 수집 + 누락 보정)")
        
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stop()

    #rest - 1분봉 생성
    def _collect_rest_stocks(self):
        while self.running:
            start_time = time.time()
            
            try:
                rest_stocks = self._get_rest_stocks()
                
                if not rest_stocks:
                    logger.debug("REST 수집 대상 없음")
                    time.sleep(5)
                    continue
                
                stock_list = list(rest_stocks)
                logger.info(f"REST 수집 시작: {len(stock_list)}개 (병렬 처리)")
                
                # 비동기 배치 호출 실행
                results = asyncio.run(
                    self.api_client.fetch_prices_batch(stock_list, batch_size=20)
                )
                
                processed = 0
                for stock_code, stock in results.items():
                    if stock:
                        self._save_price_and_aggregate(stock_code, stock.current_price, stock.volume)
                        processed += 1
                
                elapsed = time.time() - start_time
                logger.info(f"REST 수집 완료: {processed}/{len(stock_list)}개 (소요: {elapsed:.2f}초)")
                
                if elapsed < 5:
                    time.sleep(5 - elapsed)
                    
            except Exception as e:
                logger.error(f"REST 수집 오류: {e}")
                time.sleep(5)
    
    #rest로 수집할 종목 조회
    def _get_rest_stocks(self) -> Set[str]:
        try:
            top30 = set(self.redis_client.lrange(self.top_stocks_key, 0, -1)) or set()

            user_keys = self.redis_client.keys(f"{self.user_stocks_key}:*")
            user_stocks = {key.split(":")[-1] for key in user_keys} if user_keys else set()

            rest_stocks = user_stocks - top30
            return rest_stocks
            
        except Exception as e:
            logger.error(f"REST 종목 조회 실패: {e}")
            return set()
    
    #1분봉 생성
    def _save_price_and_aggregate(self, stock_code: str, price: int, volume: int):
        """현재가 버퍼링 → 1분봉 생성"""
        try:
            now = datetime.now()
            current_minute = now.replace(second=0, microsecond=0)
            
            self.current_minute_data[stock_code].append({
                'time': now,
                'price': price,
                'volume': volume
            })
            
            self._check_and_create_candle(stock_code, current_minute)
            
        except Exception as e:
            logger.error(f"{stock_code} 가격 집계 실패: {e}")
    
    #분이 바뀌면 1분봉 생성
    def _check_and_create_candle(self, stock_code: str, current_minute: datetime):
        data_list = self.current_minute_data[stock_code]
        
        if not data_list:
            return
        
        oldest_minute = data_list[0]['time'].replace(second=0, microsecond=0)
        
        if current_minute > oldest_minute:
            self._create_1min_candle(stock_code, oldest_minute, data_list)
            
            self.current_minute_data[stock_code] = [
                d for d in data_list 
                if d['time'].replace(second=0, microsecond=0) == current_minute
            ]
    
    #1분봉 생성 및 저장
    def _create_1min_candle(self, stock_code: str, minute_time: datetime, price_data: list):
        if not price_data:
            return
        
        try:
            minute_data = [
                d for d in price_data 
                if d['time'].replace(second=0, microsecond=0) == minute_time
            ]
            
            if not minute_data:
                return
            
            minute_data.sort(key=lambda x: x['time'])
            
            candle = CandleDTO(
                stock_code=stock_code,
                interval_type='1m',
                candle_time=minute_time,
                open_price=minute_data[0]['price'],
                high_price=max(d['price'] for d in minute_data),
                low_price=min(d['price'] for d in minute_data),
                close_price=minute_data[-1]['price'],
                volume=minute_data[-1]['volume']
            )
            
            self.connect_db()
            save_candle(self.conn, candle, auto_commit=True)
            logger.debug(f"{stock_code} 1분봉 생성: {minute_time}")
            
            self.last_candle_created[stock_code] = minute_time
            
            self._try_create_aggregated_candles(stock_code, minute_time)
            
        except Exception as e:
            logger.error(f"{stock_code} 1분봉 생성 실패: {e}")
    
    #5분봉/30분봉 생성 지점 확인
    def _try_create_aggregated_candles(self, stock_code: str, minute_time: datetime):
        if minute_time.minute % 5 == 4:
            self._create_5min_candle(stock_code, minute_time)
        
        if minute_time.minute % 30 == 29:
            self._create_30min_candle(stock_code, minute_time)
    
    #DB의 1분봉으로 5분봉 생성
    def _create_5min_candle(self, stock_code: str, minute_time: datetime):
        try:
            aligned_time = minute_time.replace(minute=(minute_time.minute // 5) * 5)
            end_time = aligned_time + timedelta(minutes=4, seconds=59)
            
            self.connect_db()
            cursor = self.conn.cursor()
            
            query = """
            SELECT candle_time, open_price, high_price, low_price, close_price, volume
            FROM chart_candles
            WHERE stock_code = %s AND interval_type = '1m'
            AND candle_time >= %s AND candle_time <= %s
            ORDER BY candle_time ASC
            """
            cursor.execute(query, (stock_code, aligned_time, end_time))
            rows = cursor.fetchall()
            
            if len(rows) >= 1:
                candle_5m = CandleDTO(
                    stock_code=stock_code,
                    interval_type='5m',
                    candle_time=aligned_time,
                    open_price=rows[0][1],
                    high_price=max(row[2] for row in rows),
                    low_price=min(row[3] for row in rows),
                    close_price=rows[-1][4],
                    volume=sum(row[5] for row in rows)
                )
                save_candle(self.conn, candle_5m, auto_commit=True)
                logger.info(f"{stock_code} 5분봉 생성: {aligned_time}")
        except Exception as e:
            logger.error(f"{stock_code} 5분봉 생성 실패: {e}")
    
    #DB의 5분봉으로 30분봉 생성
    def _create_30min_candle(self, stock_code: str, minute_time: datetime):
        try:
            aligned_time = minute_time.replace(minute=(minute_time.minute // 30) * 30)
            end_time = aligned_time + timedelta(minutes=29, seconds=59)
            
            self.connect_db()
            cursor = self.conn.cursor()
            
            query = """
            SELECT candle_time, open_price, high_price, low_price, close_price, volume
            FROM chart_candles
            WHERE stock_code = %s AND interval_type = '5m'
            AND candle_time >= %s AND candle_time <= %s
            ORDER BY candle_time ASC
            """
            cursor.execute(query, (stock_code, aligned_time, end_time))
            rows = cursor.fetchall()
            
            if len(rows) >= 1:
                candle_30m = CandleDTO(
                    stock_code=stock_code,
                    interval_type='30m',
                    candle_time=aligned_time,
                    open_price=rows[0][1],
                    high_price=max(row[2] for row in rows),
                    low_price=min(row[3] for row in rows),
                    close_price=rows[-1][4],
                    volume=sum(row[5] for row in rows)
                )
                save_candle(self.conn, candle_30m, auto_commit=True)
                logger.info(f"{stock_code} 30분봉 생성: {aligned_time}")
        except Exception as e:
            logger.error(f"{stock_code} 30분봉 생성 실패: {e}")

    #누락 보정
    def _fill_missing_candles(self):
        logger.info("누락 보정 스레드 시작")
        
        while self.running:
            try:
                time.sleep(1)
                
                all_stocks = self.stock_manager.get_all_target_stocks()
                
                if not all_stocks:
                    continue
                
                now = datetime.now()
                
                for stock_code in all_stocks:
                    last_time = self.last_fill_time.get(stock_code)
                    
                    if last_time is None or (now - last_time) >= timedelta(minutes=5):
                        try:
                            self.candle_filler.fill_missing_candles(
                                stock_code=stock_code,
                                target_date=now.date(),
                                fill_1m=True,
                                fill_5m=True,
                                fill_30m=True
                            )
                            self.last_fill_time[stock_code] = now
                            logger.debug(f"{stock_code} 누락 보정 완료")
                            
                        except Exception as e:
                            logger.error(f"{stock_code} 누락 보정 실패: {e}")
                        
                        time.sleep(0.05)
                        
            except Exception as e:
                logger.error(f"누락 보정 오류: {e}")
                time.sleep(5)
    
    def close(self):
        self.running = False
        self.candle_filler.close()
        if self.conn:
            self.conn.close()
        logger.info("RealtimeCollector 종료")