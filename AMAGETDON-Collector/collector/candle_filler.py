from datetime import datetime, timedelta, date
from typing import List, Set
from core.token_manager import TokenManager
from models.dto import CandleDTO
from utils.logger import logger
from utils.db import get_db_connection, save_candles
from utils.kis_api_client import KISApiClient

class CandleFiller:
    
    def __init__(self, token_manager: TokenManager):
        self.token_manager = token_manager
        self.api_client = KISApiClient(token_manager)
        self.conn = None
    
    def connect_db(self):
        self.conn = get_db_connection(self.conn)
    
    #누락 보정
    def fill_missing_candles(
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
            filled_1m = self._fill_1min_candles(stock_code, target_date, target_date_str)
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
    def _fill_1min_candles(self, stock_code: str, target_date: date, target_date_str: str) -> int:
        existing_minutes = self._get_existing_1min_candles(stock_code, target_date)
        
        expected_minutes = self._get_expected_minutes(target_date)
        
        missing_minutes = expected_minutes - existing_minutes
        
        if not missing_minutes:
            return 0
        
        today = datetime.now().date()
        now = datetime.now()
        
        if target_date == today and now.hour >= 9:
            candles_dict = self.api_client.fetch_minute_candles_by_time(
                stock_code=stock_code,
                needed_minutes=missing_minutes
            )
            logger.info(f"{stock_code} 오늘 1분봉 {len(missing_minutes)}개 보정 시도")
        else:
            candles_dict = self.api_client.fetch_minute_candles_by_date(
                stock_code=stock_code,
                target_date=target_date_str,
                needed_minutes=missing_minutes
            )
            logger.info(f"{stock_code} {target_date_str} 1분봉 {len(missing_minutes)}개 보정 시도")
        
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
        
        self.connect_db()
        candles_to_save = []
        today = datetime.now().date()
        now = datetime.now()
        
        for slot_time in missing_5m_slots:
            minute_candles = self._get_1min_candles_for_slot(
                stock_code, slot_time, minutes=5
            )
            
            if len(minute_candles) < 5:
                needed_minutes = set()
                for i in range(5):
                    needed_minutes.add(slot_time + timedelta(minutes=i))
                
                existing_times = {c['time'] for c in minute_candles}
                needed_minutes -= existing_times
                
                if needed_minutes:
                    if target_date == today and now.hour >= 9:
                        candles_dict = self.api_client.fetch_minute_candles_by_time(
                            stock_code=stock_code,
                            needed_minutes=needed_minutes
                        )
                    else:
                        candles_dict = self.api_client.fetch_minute_candles_by_date(
                            stock_code=stock_code,
                            target_date=target_date_str,
                            needed_minutes=needed_minutes
                        )
                    
                    for candle_time, candle_data in candles_dict.items():
                        candle_1m = CandleDTO(
                            stock_code=stock_code,
                            interval_type='1m',
                            candle_time=candle_time,
                            open_price=candle_data['open'],
                            high_price=candle_data['high'],
                            low_price=candle_data['low'],
                            close_price=candle_data['close'],
                            volume=candle_data['volume']
                        )
                        candles_to_save.append(candle_1m)
                        
                        minute_candles.append({
                            'time': candle_time,
                            'open': candle_data['open'],
                            'high': candle_data['high'],
                            'low': candle_data['low'],
                            'close': candle_data['close'],
                            'volume': candle_data['volume']
                        })
            
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
        
        if candles_to_save:
            save_candles(self.conn, candles_to_save)
        
        saved_5m_count = sum(1 for c in candles_to_save if c.interval_type == '5m')
        return saved_5m_count
    
    #30분봉 누락 보정
    def _fill_30min_candles(self, stock_code: str, target_date: date, target_date_str: str) -> int:
        missing_30m_slots = self._find_missing_30min_slots(stock_code, target_date)
    
        if not missing_30m_slots:
            return 0
        
        self.connect_db()
        candles_to_save = []
        
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
        
        if candles_to_save:
            save_candles(self.conn, candles_to_save)
        
        return len(candles_to_save)
    
    #기존 1분봉 조회
    def _get_existing_1min_candles(self, stock_code: str, target_date: date) -> Set[datetime]:
        self.connect_db()
        cursor = self.conn.cursor()
        
        query = """
        SELECT candle_time
        FROM chart_candles
        WHERE stock_code = %s
          AND interval_type = '1m'
          AND DATE(candle_time) = %s
        """
        
        cursor.execute(query, (stock_code, target_date))
        return {row[0] for row in cursor.fetchall()}
    
    #모든 1분 시간 생성 (09:00 ~ 15:30)
    def _get_expected_minutes(self, target_date: date) -> Set[datetime]:
        expected = set()
        start = datetime(target_date.year, target_date.month, target_date.day, 9, 0)
        end = datetime(target_date.year, target_date.month, target_date.day, 15, 30)
        
        current = start
        while current <= end:
            expected.add(current)
            current += timedelta(minutes=1)
        
        return expected
    
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