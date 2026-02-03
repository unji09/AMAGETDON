import asyncio
import time
import aiohttp
from datetime import datetime, timedelta, date
from typing import List, Optional, Dict
from core.token_manager import TokenManager
from models.dto import CandleDTO
from utils.logger import logger
from utils.db import get_db_connection, save_candles
from utils.kis_api_client import KISApiClient
from utils.rate_limiter import HardRateLimiter

class CandleFiller:
    
    def __init__(self, token_manager: TokenManager):
        self.token_manager = token_manager
        self.api_client = KISApiClient(token_manager)
        self.conn = None
    
    def connect_db(self):
        self.conn = get_db_connection(self.conn)
    
    #누락 보정
    async def fill_missing_candles(
        self,
        stock_code: str,
        target_date: date = None,
        fill_1m: bool = True,
        fill_5m: bool = True,
        fill_30m: bool = True
    ):

        if target_date is None:
            target_date = datetime.now().date()

        target_date_str = target_date.strftime('%Y%m%d')

        if fill_1m:
            filled_1m = await self._fill_1min_candles(stock_code, target_date, target_date_str)
            if filled_1m > 0:
                logger.info(f"{stock_code} 1분봉 {filled_1m}개 보정")

        if fill_5m:
            filled_5m = self._fill_5min_candles(stock_code, target_date, target_date_str)
            if filled_5m > 0:
                logger.info(f"{stock_code} 5분봉 {filled_5m}개 보정")

        if fill_30m:
            filled_30m = self._fill_30min_candles(stock_code, target_date, target_date_str)
            if filled_30m > 0:
                logger.info(f"{stock_code} 30분봉 {filled_30m}개 보정")
    
    #1분봉 누락 보정
    async def _fill_1min_candles(self, stock_code: str, target_date: date, target_date_str: str) -> int:
        last_candle_time = self._get_last_1min_candle_time(stock_code, target_date)

        today = datetime.now().date()
        now = datetime.now()

        if last_candle_time:
            start_time = (last_candle_time + timedelta(minutes=1)).strftime('%H%M%S')
        else:
            start_time = "090000"

        if target_date == today:
            if now.hour < 9:
                logger.debug(f"{stock_code} 장 시작 전 - 스킵")
                return 0
            end_time = now.strftime('%H%M%S')
        else:
            end_time = "153000"

        if start_time >= end_time:
            return 0

        async with aiohttp.ClientSession() as session:
            candles_dict = await self.api_client.fetch_minute_candles_by_date_async(
                session=session,
                stock_code=stock_code,
                target_date=target_date_str,
                start_time=start_time,
                end_time=end_time
            )

        if candles_dict:
            logger.info(f"{stock_code} 1분봉 {len(candles_dict)}개 수집")
        else:
            logger.warning(f"{stock_code} 1분봉 수집 결과 없음 ({target_date_str})")
        
        self.connect_db()
        candles_to_save = []
        
        for candle_time, candle_data in candles_dict.items():
            candle = CandleDTO(
                stock_code=stock_code,
                interval_type='1m',
                candle_time=candle_time,
                open_price=candle_data['open'],
                high_price=candle_data['high'],
                low_price=candle_data['low'],
                close_price=candle_data['close'],
                volume=candle_data['volume']
            )
            candles_to_save.append(candle)
        
        if candles_to_save:
            save_candles(self.conn, candles_to_save)
        
        return len(candles_to_save)
    
    #5분봉 누락 보정
    def _fill_5min_candles(self, stock_code: str, target_date: date, target_date_str: str) -> int:
        missing_5m_slots = self._find_missing_5min_slots(stock_code, target_date)

        if not missing_5m_slots:
            return 0

        logger.debug(f"{stock_code} 5분봉 누락 슬롯: {len(missing_5m_slots)}개")

        self.connect_db()
        candles_to_save = []
        no_data_count = 0

        for slot_time in missing_5m_slots:
            minute_candles = self._get_1min_candles_for_slot(
                stock_code, slot_time, minutes=5
            )

            if len(minute_candles) >= 1:
                minute_candles.sort(key=lambda x: x['time'])

                candle_5m = CandleDTO(
                    stock_code=stock_code,
                    interval_type='5m',
                    candle_time=slot_time,
                    open_price=minute_candles[0]['open'],
                    high_price=max(c['high'] for c in minute_candles),
                    low_price=min(c['low'] for c in minute_candles),
                    close_price=minute_candles[-1]['close'],
                    volume=sum(c['volume'] for c in minute_candles)
                )
                candles_to_save.append(candle_5m)
            else:
                no_data_count += 1

        if no_data_count > 0:
            logger.debug(f"{stock_code} 5분봉: 1분봉 없어서 {no_data_count}개 슬롯 스킵")

        if candles_to_save:
            save_candles(self.conn, candles_to_save)

        return len(candles_to_save)

    #30분봉 누락 보정
    def _fill_30min_candles(self, stock_code: str, target_date: date, target_date_str: str) -> int:
        missing_30m_slots = self._find_missing_30min_slots(stock_code, target_date)

        if not missing_30m_slots:
            return 0

        logger.debug(f"{stock_code} 30분봉 누락 슬롯: {len(missing_30m_slots)}개")

        self.connect_db()
        candles_to_save = []
        no_data_count = 0

        for slot_time in missing_30m_slots:
            candles_5m = self._get_5min_candles_for_slot(
                stock_code, slot_time, minutes=30
            )

            if len(candles_5m) >= 1:
                candle_30m = CandleDTO(
                    stock_code=stock_code,
                    interval_type='30m',
                    candle_time=slot_time,
                    open_price=candles_5m[0]['open'],
                    high_price=max(c['high'] for c in candles_5m),
                    low_price=min(c['low'] for c in candles_5m),
                    close_price=candles_5m[-1]['close'],
                    volume=sum(c['volume'] for c in candles_5m)
                )
                candles_to_save.append(candle_30m)
            else:
                no_data_count += 1

        if no_data_count > 0:
            logger.debug(f"{stock_code} 30분봉: 5분봉 없어서 {no_data_count}개 슬롯 스킵")

        if candles_to_save:
            save_candles(self.conn, candles_to_save)

        return len(candles_to_save)

    def _get_last_1min_candle_time(self, stock_code: str, target_date: date) -> Optional[datetime]:
        self.connect_db()
        cursor = self.conn.cursor()
        
        query = """
        SELECT MAX(candle_time)
        FROM chart_candles
        WHERE stock_code = %s
        AND interval_type = '1m'
        AND DATE(candle_time) = %s
        """
        
        cursor.execute(query, (stock_code, target_date))
        result = cursor.fetchone()
        return result[0] if result and result[0] else None
    
    #누락된 5분봉 찾기
    def _find_missing_5min_slots(self, stock_code: str, target_date: date) -> List[datetime]:
        self.connect_db()
        cursor = self.conn.cursor()
        
        query = """
        SELECT candle_time
        FROM chart_candles
        WHERE stock_code = %s
          AND interval_type = '5m'
          AND DATE(candle_time) = %s
        """
        cursor.execute(query, (stock_code, target_date))
        existing_5m = {row[0] for row in cursor.fetchall()}
        
        expected_5m = []
        start = datetime(target_date.year, target_date.month, target_date.day, 9, 0)
        end = datetime(target_date.year, target_date.month, target_date.day, 15, 30)
        
        current = start
        while current < end:
            expected_5m.append(current)
            current += timedelta(minutes=5)
        
        missing = [slot for slot in expected_5m if slot not in existing_5m]
        return missing
    
    #누락된 30분봉 찾기
    def _find_missing_30min_slots(self, stock_code: str, target_date: date) -> List[datetime]:
        self.connect_db()
        cursor = self.conn.cursor()
        
        query = """
        SELECT candle_time
        FROM chart_candles
        WHERE stock_code = %s
          AND interval_type = '30m'
          AND DATE(candle_time) = %s
        """
        cursor.execute(query, (stock_code, target_date))
        existing_30m = {row[0] for row in cursor.fetchall()}
        
        expected_30m = []
        start = datetime(target_date.year, target_date.month, target_date.day, 9, 0)
        end = datetime(target_date.year, target_date.month, target_date.day, 15, 30)
        
        current = start
        while current < end:
            expected_30m.append(current)
            current += timedelta(minutes=30)
        
        missing = [slot for slot in expected_30m if slot not in existing_30m]
        return missing
    
    #특정 시간의 1분봉 조회
    def _get_1min_candles_for_slot(
        self, 
        stock_code: str, 
        slot_time: datetime, 
        minutes: int
    ) -> List[dict]:
        self.connect_db()
        cursor = self.conn.cursor()
        
        end_time = slot_time + timedelta(minutes=minutes-1, seconds=59)
        
        query = """
        SELECT candle_time, open_price, high_price, low_price, close_price, volume
        FROM chart_candles
        WHERE stock_code = %s
          AND interval_type = '1m'
          AND candle_time >= %s
          AND candle_time <= %s
        ORDER BY candle_time ASC
        """
        
        cursor.execute(query, (stock_code, slot_time, end_time))
        
        candles = []
        for row in cursor.fetchall():
            candles.append({
                'time': row[0],
                'open': row[1],
                'high': row[2],
                'low': row[3],
                'close': row[4],
                'volume': row[5]
            })
        
        return candles
    
    #특정 시간의 5분봉 조회
    def _get_5min_candles_for_slot(
        self, 
        stock_code: str, 
        slot_time: datetime, 
        minutes: int
    ) -> List[dict]:
        self.connect_db()
        cursor = self.conn.cursor()
        
        end_time = slot_time + timedelta(minutes=minutes-1, seconds=59)
        
        query = """
        SELECT candle_time, open_price, high_price, low_price, close_price, volume
        FROM chart_candles
        WHERE stock_code = %s
          AND interval_type = '5m'
          AND candle_time >= %s
          AND candle_time <= %s
        ORDER BY candle_time ASC
        """
        
        cursor.execute(query, (stock_code, slot_time, end_time))
        
        candles = []
        for row in cursor.fetchall():
            candles.append({
                'time': row[0],
                'open': row[1],
                'high': row[2],
                'low': row[3],
                'close': row[4],
                'volume': row[5]
            })
        
        return candles
    
    def close(self):
        if self.conn:
            self.conn.close()

    #병렬 처리용
    @staticmethod
    async def fill_missing_candles_parallel(
        token_manager: TokenManager,
        stock_codes: List[str],
        rate_limit: int = 19,
        fill_1m: bool = True,
        fill_5m: bool = True,
        fill_30m: bool = True,
        batch_size: int = 100,
        target_date: date = None
    ) -> Dict[str, any]:

        start_time = time.time()
        limiter = HardRateLimiter(rate_limit)

        success_count = 0
        fail_count = 0

        total_batches = (len(stock_codes) + batch_size - 1) // batch_size

        async def fill_worker(stock_code: str) -> Dict[str, int]:
            try:
                await limiter.acquire()
                filler = CandleFiller(token_manager)
                await filler.fill_missing_candles(
                    stock_code=stock_code,
                    target_date=target_date,
                    fill_1m=fill_1m,
                    fill_5m=fill_5m,
                    fill_30m=fill_30m
                )
                filler.close()
                return {'success': 1, 'fail': 0}

            except Exception as e:
                logger.error(f"{stock_code} 보정 실패: {e}")
                return {'success': 0, 'fail': 1}

        for batch_idx in range(total_batches):
            batch_start = batch_idx * batch_size
            batch_end = min(batch_start + batch_size, len(stock_codes))
            batch_codes = stock_codes[batch_start:batch_end]

            batch_start_time = time.time()
            tasks = [fill_worker(code) for code in batch_codes]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            batch_success = 0
            batch_fail = 0
            for result in results:
                if isinstance(result, Exception):
                    fail_count += 1
                    batch_fail += 1
                elif result:
                    success_count += result.get('success', 0)
                    fail_count += result.get('fail', 0)
                    batch_success += result.get('success', 0)
                    batch_fail += result.get('fail', 0)

            batch_elapsed = time.time() - batch_start_time
            logger.info(f"누락 보정 배치 {batch_idx + 1}/{total_batches}: {batch_success}성공, {batch_fail}실패, {batch_elapsed:.1f}초")

        elapsed = time.time() - start_time
        api_calls = limiter.get_call_count()

        return {
            'success_count': success_count,
            'fail_count': fail_count,
            'elapsed_time': elapsed,
            'api_calls': api_calls,
            'req_per_sec': api_calls / elapsed if elapsed > 0 else 0
        }