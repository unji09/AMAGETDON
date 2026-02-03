from datetime import datetime, timedelta
from typing import Dict
from collections import defaultdict
from models.dto import CandleDTO
from utils.logger import logger
from utils.db import get_db_connection, save_candle

class RealtimeCandleBuilder:

    def __init__(self):
        self.conn = None
        self.current_minute: Dict[str, list] = defaultdict(list)
        self.last_completed: Dict[str, datetime] = {}
    
    def connect_db(self):
        self.conn = get_db_connection(self.conn)
    
    #websocket 데이터 분 단위 정규화
    def on_tick(self, stock_code: str, tick_data: dict):
        try:
            tick_time = tick_data['time']
            minute_time = tick_time.replace(second=0, microsecond=0)
            
            self.current_minute[stock_code].append({
                'time': tick_time,
                'price': tick_data['price'],
                'volume': tick_data['volume']
            })
            
            self._check_minute_complete(stock_code, minute_time)
            
        except Exception as e:
            logger.error(f"체결 데이터 처리 실패: {e}")
    
    #분이 바뀌었는지 확인 후 1분봉 생성
    def _check_minute_complete(self, stock_code: str, current_minute: datetime):
        ticks = self.current_minute[stock_code]
        if not ticks:
            return
        
        oldest_minute = ticks[0]['time'].replace(second=0, microsecond=0)
        
        if current_minute > oldest_minute:
            self._create_and_save_minute_candle(stock_code, oldest_minute, ticks)

            self.current_minute[stock_code] = [
                t for t in ticks 
                if t['time'].replace(second=0, microsecond=0) == current_minute
            ]
    
    #1분봉 생성/저장
    def _create_and_save_minute_candle(self, stock_code: str, minute_time: datetime, ticks: list):
        if not ticks:
            return
        
        try:
            ticks.sort(key=lambda x: x['time'])
            
            candle_1m = CandleDTO(
                stock_code=stock_code,
                interval_type='1m',
                candle_time=minute_time,
                open_price=ticks[0]['price'],
                high_price=max(t['price'] for t in ticks),
                low_price=min(t['price'] for t in ticks),
                close_price=ticks[-1]['price'],
                volume=sum(t['volume'] for t in ticks)
            )
            
            self.connect_db()
            save_candle(self.conn, candle_1m, auto_commit=True)
            logger.debug(f"{stock_code} 1분봉 생성: {minute_time}")
            
            self.last_completed[stock_code] = minute_time
            
            self._try_create_aggregated_candles(stock_code, minute_time)
            
        except Exception as e:
            logger.error(f"1분봉 생성 실패: {e}")
    
    #5분봉/30분봉 생성
    def _try_create_aggregated_candles(self, stock_code: str, minute_time: datetime):
        if minute_time.minute % 5 == 4:
            aligned_time = minute_time.replace(minute=(minute_time.minute // 5) * 5)
            self._create_5min_candle_from_db(stock_code, aligned_time)
        
        if minute_time.minute % 30 == 29:
            aligned_time = minute_time.replace(minute=(minute_time.minute // 30) * 30)
            self._create_30min_candle_from_db(stock_code, aligned_time)

    #5분봉 집계
    def _create_5min_candle_from_db(self, stock_code: str, start_time: datetime):
        try:
            self.connect_db()
            cursor = self.conn.cursor()
            end_time = start_time + timedelta(minutes=4, seconds=59)
            
            query = """
            SELECT candle_time, open_price, high_price, low_price, close_price, volume
            FROM chart_candles
            WHERE stock_code = %s AND interval_type = '1m'
            AND candle_time >= %s AND candle_time <= %s
            ORDER BY candle_time ASC
            """
            cursor.execute(query, (stock_code, start_time, end_time))
            rows = cursor.fetchall()
            
            if len(rows) >= 1:
                candle_5m = CandleDTO(
                    stock_code=stock_code,
                    interval_type='5m',
                    candle_time=start_time,
                    open_price=rows[0][1],
                    high_price=max(row[2] for row in rows),
                    low_price=min(row[3] for row in rows),
                    close_price=rows[-1][4],
                    volume=sum(row[5] for row in rows)
                )
                save_candle(self.conn, candle_5m, auto_commit=True)
                logger.info(f"{stock_code} 5분봉 생성: {start_time} (1분봉 {len(rows)}개)")
            else:
                logger.debug(f"{stock_code} 5분봉 스킵: {start_time} (1분봉 없음)")
                
        except Exception as e:
            logger.error(f"5분봉 생성 실패: {e}")

    #30분봉 집계
    def _create_30min_candle_from_db(self, stock_code: str, start_time: datetime):
        try:
            self.connect_db()
            cursor = self.conn.cursor()
            
            end_time = start_time + timedelta(minutes=29, seconds=59)
            
            query = """
            SELECT candle_time, open_price, high_price, low_price, close_price, volume
            FROM chart_candles
            WHERE stock_code = %s
            AND interval_type = '5m'
            AND candle_time >= %s
            AND candle_time <= %s
            ORDER BY candle_time ASC
            """
            
            cursor.execute(query, (stock_code, start_time, end_time))
            rows = cursor.fetchall()
            
            if len(rows) >= 1:
                candle_30m = CandleDTO(
                    stock_code=stock_code,
                    interval_type='30m',
                    candle_time=start_time,
                    open_price=rows[0][1],
                    high_price=max(row[2] for row in rows),
                    low_price=min(row[3] for row in rows),
                    close_price=rows[-1][4],
                    volume=sum(row[5] for row in rows)
                )
                save_candle(self.conn, candle_30m, auto_commit=True)
                logger.info(f"{stock_code} 30분봉 생성: {start_time} (5분봉 {len(rows)}개)")
            else:
                logger.debug(f"{stock_code} 30분봉 스킵: {start_time} (5분봉 없음)")
            
        except Exception as e:
            logger.error(f"30분봉 생성 실패: {e}")
    
    def flush_all(self):
        """남아있는 틱 데이터로 캔들 생성 (장 마감 시 호출)"""
        for stock_code, ticks in list(self.current_minute.items()):
            if ticks:
                minute_time = ticks[0]['time'].replace(second=0, microsecond=0)
                self._create_and_save_minute_candle(stock_code, minute_time, ticks)
        self.current_minute.clear()
        logger.info("남은 틱 데이터 캔들 생성 완료")

    def close(self):
        self.flush_all()
        if self.conn:
            self.conn.close()