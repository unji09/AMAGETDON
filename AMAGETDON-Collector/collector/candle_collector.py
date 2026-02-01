import time
import asyncio
import aiohttp
from typing import List, Optional
from datetime import datetime, timedelta
from core.token_manager import TokenManager
from models.dto import CandleDTO
from utils.logger import logger
from utils.db import get_db_connection
from utils.kis_api_client import KISApiClient
from utils.db import save_candles

class CandleCollector:

    RETENTION_DAYS = {
        '5m': 1,
        '30m': 7,
        '1d': 90,
        '1w': 365
    }

    def __init__(self, token_manager: TokenManager):
        self.token_manager = token_manager
        self.api_client = KISApiClient(token_manager)
        self.conn = None

    def connect_db(self):
        self.conn = get_db_connection(self.conn)
    
    #캔들 데이터 수집/업데이트
    def collect_or_update(self, stock_code: str, interval_type: str):
        try:
            last_time = self._get_last_candle_time(stock_code, interval_type)
            
            if last_time is None:
                days = self.RETENTION_DAYS[interval_type]
                logger.info(f"{stock_code} {interval_type} 초기 수집: {days}일")
                self._collect_candles(stock_code, interval_type, days)
            else:
                now = datetime.now()
                days_diff = (now - last_time).days + 1
                days_diff = max(days_diff, 1)
                
                logger.info(f"{stock_code} {interval_type} 수집하지 않았던 시간의 1분봉 수집: {days_diff}일")
                self._collect_candles(stock_code, interval_type, days_diff)
                
        except Exception as e:
            logger.error(f"{stock_code} {interval_type} 수집 실패: {e}")
    
    #interval_type에 따라 적절한 함수 호출
    def _collect_candles(self, stock_code: str, interval_type: str, days: int):
        try:
            if interval_type in ['5m', '30m']:
                candles = self._collect_minute_based_candles(stock_code, interval_type, days)
            elif interval_type == '1d':
                candles = self._collect_daily_candles(stock_code, days)
            elif interval_type == '1w':
                candles = self._collect_weekly_candles(stock_code, days)
            else:
                logger.error(f"지원하지 않는 interval_type: {interval_type}")
                return

            if candles:
                self.connect_db()
                save_candles(self.conn, candles)
                logger.info(f"{stock_code} {interval_type} 캔들 {len(candles)}개 저장")
            else:
                logger.warning(f"{stock_code} {interval_type} 캔들 데이터 없음")

        except Exception as e:
            logger.error(f"{stock_code} {interval_type} 수집 실패: {e}")
    
    #해당 종목의 마지막 시간 조회
    def _get_last_candle_time(self, stock_code: str, interval_type: str) -> Optional[datetime]:
        try:
            self.connect_db()
            cursor = self.conn.cursor()
            
            query = """
            SELECT MAX(candle_time) 
            FROM chart_candles 
            WHERE stock_code = %s AND interval_type = %s
            """
            
            cursor.execute(query, (stock_code, interval_type))
            result = cursor.fetchone()
            
            return result[0] if result and result[0] else None
            
        except Exception as e:
            logger.error(f"마지막 캔들 시간 조회 실패: {e}")
            return None
    
    #분봉 기반 캔들 수집
    async def _collect_minute_based_candles(
        self, 
        stock_code: str, 
        interval_type: str, 
        days: int
    ) -> List[CandleDTO]:
        minute_unit = 30 if interval_type == '30m' else 5
        all_candles = {}
        
        # 날짜별 요청 준비
        requests = []
        for i in range(days):
            target_date = (datetime.now() - timedelta(days=i)).date()
            target_date_str = target_date.strftime('%Y%m%d')
            requests.append((stock_code, target_date_str))
        
        # 배치 처리로 병렬 호출
        results = await self.api_client.fetch_minute_candles_batch(requests)
        
        for (code, date_str), candles_dict in results.items():
            if candles_dict:
                all_candles.update(candles_dict)
                logger.debug(f"{date_str} {len(candles_dict)}개 수집")
        
        if not all_candles:
            return []
        
        return self._aggregate_candles(stock_code, interval_type, all_candles, minute_unit)
    
    
    #1분봉 -> 5분봉/30분봉 집계
    def _aggregate_candles(
        self, 
        stock_code: str, 
        interval_type: str, 
        candles_dict: dict,
        minute_unit: int
    ) -> List[CandleDTO]:
        if not candles_dict:
            return []
        
        sorted_times = sorted(candles_dict.keys())
        
        aggregated = []
        current_group_times = []
        current_slot_time = None
        
        for candle_time in sorted_times:
            aligned_minute = (candle_time.minute // minute_unit) * minute_unit
            slot_time = candle_time.replace(minute=aligned_minute, second=0, microsecond=0)
            
            if current_slot_time is None or slot_time != current_slot_time:
                if current_group_times: 
                    agg_candle = self._create_aggregated_candle(
                        stock_code, 
                        interval_type, 
                        current_slot_time, 
                        current_group_times,
                        candles_dict
                    )
                    if agg_candle:
                        aggregated.append(agg_candle)
                
                current_slot_time = slot_time
                current_group_times = [candle_time] 
            else:
                current_group_times.append(candle_time)
        
        if current_group_times: 
            agg_candle = self._create_aggregated_candle(
                stock_code,
                interval_type,
                current_slot_time,
                current_group_times,
                candles_dict 
            )
            if agg_candle:
                aggregated.append(agg_candle)

        return aggregated
    
    #캔들 생성
    def _create_aggregated_candle(
        self, 
        stock_code: str, 
        interval_type: str, 
        slot_time: datetime, 
        group_times: list,
        candles_dict: dict
    ) -> Optional[CandleDTO]:
        if not group_times:
            return None
        
        try:
            group_candles = [candles_dict[t] for t in group_times]
            
            return CandleDTO(
                stock_code=stock_code,
                interval_type=interval_type,
                candle_time=slot_time,
                open_price=group_candles[0]['open'],
                high_price=max(c['high'] for c in group_candles),
                low_price=min(c['low'] for c in group_candles),
                close_price=group_candles[-1]['close'],
                volume=sum(c['volume'] for c in group_candles)
            )
            
        except Exception as e:
            logger.error(f"캔들 집계 실패: {e}")
            return None
    
    #일봉 수집
    def _collect_daily_candles(self, stock_code: str, days: int) -> List[CandleDTO]:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y%m%d')
        end_date = datetime.now().strftime('%Y%m%d')
        
        candles_list = self.api_client.fetch_daily_candles(
            stock_code=stock_code,
            start_date=start_date,
            end_date=end_date,
            period_code='D'
        )
        
        return [
            CandleDTO(
                stock_code=stock_code,
                interval_type='1d',
                candle_time=c['date'],
                open_price=c['open'],
                high_price=c['high'],
                low_price=c['low'],
                close_price=c['close'],
                volume=c['volume']
            )
            for c in candles_list
        ]
    
    #주봉 수집
    def _collect_weekly_candles(self, stock_code: str, days: int) -> List[CandleDTO]:
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y%m%d')
        end_date = datetime.now().strftime('%Y%m%d')
        
        candles_list = self.api_client.fetch_daily_candles(
            stock_code=stock_code,
            start_date=start_date,
            end_date=end_date,
            period_code='W'
        )
        
        return [
            CandleDTO(
                stock_code=stock_code,
                interval_type='1w',
                candle_time=c['date'],
                open_price=c['open'],
                high_price=c['high'],
                low_price=c['low'],
                close_price=c['close'],
                volume=c['volume']
            )
            for c in candles_list
        ]
    
    def close(self):
        if self.conn:
            self.conn.close()