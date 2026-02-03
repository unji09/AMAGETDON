import asyncio
import time
import aiohttp
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from core.token_manager import TokenManager
from models.dto import CandleDTO, StockDTO
from utils.logger import logger
from utils.db import get_db_connection, save_stock_price, save_candles, get_latest_candle
from utils.kis_api_client import KISApiClient
from utils.rate_limiter import HardRateLimiter, BatchRetryStats

class CandleCollector:

    RETENTION_DAYS = {
        '5m': 1,
        '30m': 7,
        '1d': 90,
        '1w': 365
    }

    # 종목명 캐시
    _stock_names = {}

    def __init__(self, token_manager: TokenManager):
        self.token_manager = token_manager
        self.api_client = KISApiClient(token_manager)
        self.conn = None
        self._load_stock_names()

    def _load_stock_names(self):
        """DB에서 종목명 로드"""
        if CandleCollector._stock_names:
            return
        try:
            conn = get_db_connection(None)
            cursor = conn.cursor()
            cursor.execute("SELECT stock_code, stock_name FROM stock")
            for row in cursor.fetchall():
                CandleCollector._stock_names[row[0]] = row[1]
            conn.close()
        except Exception as e:
            logger.error(f"종목명 로드 실패: {e}")

    def _get_stock_name(self, stock_code: str) -> str:
        """종목명 반환"""
        return CandleCollector._stock_names.get(stock_code, "")

    def connect_db(self):
        self.conn = get_db_connection(self.conn)

    # [미사용] 비동기 수집/업데이트 - collect_batch_parallel 사용
    # async def collect_or_update_async(self, stock_code: str, interval_type: str):
    #     try:
    #         last_time = self._get_last_candle_time(stock_code, interval_type)
    #
    #         if last_time is None:
    #             days = self.RETENTION_DAYS[interval_type]
    #             logger.info(f"{stock_code} {interval_type} 초기 수집: {days}일")
    #             await self._collect_candles_async(stock_code, interval_type, days)
    #         else:
    #             now = datetime.now()
    #             days_diff = (now - last_time).days + 1
    #             days_diff = max(days_diff, 1)
    #
    #             logger.info(f"{stock_code} {interval_type} 업데이트 수집: {days_diff}일")
    #             await self._collect_candles_async(stock_code, interval_type, days_diff)
    #
    #     except Exception as e:
    #         logger.error(f"{stock_code} {interval_type} 수집 실패: {e}")

    # [미사용] _collect_candles_async - collect_batch_parallel 사용
    # async def _collect_candles_async(self, stock_code: str, interval_type: str, days: int):
    #     try:
    #         if interval_type in ['5m', '30m']:
    #             candles = await self._collect_minute_based_candles(stock_code, interval_type, days)
    #         elif interval_type == '1d':
    #             candles = await self._collect_daily_candles(stock_code, days)
    #         elif interval_type == '1w':
    #             candles = await self._collect_weekly_candles(stock_code, days)
    #         else:
    #             logger.error(f"지원하지 않는 interval_type: {interval_type}")
    #             return
    #
    #         if candles:
    #             self.connect_db()
    #             save_candles(self.conn, candles)
    #             logger.info(f"{stock_code} {interval_type} 캔들 {len(candles)}개 저장")
    #         else:
    #             logger.warning(f"{stock_code} {interval_type} 캔들 데이터 없음")
    #
    #     except Exception as e:
    #         logger.error(f"{stock_code} {interval_type} 수집 실패: {e}")

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

        requests = []
        for i in range(days):
            target_date = (datetime.now() - timedelta(days=i)).date()
            target_date_str = target_date.strftime('%Y%m%d')
            requests.append((stock_code, target_date_str))

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

    # [미사용] 일봉 수집 - _collect_and_save_daily_candles_direct 사용
    # async def _collect_daily_candles(self, stock_code: str, days: int) -> List[CandleDTO]:
    #     start_date = (datetime.now() - timedelta(days=days)).strftime('%Y%m%d')
    #     end_date = datetime.now().strftime('%Y%m%d')
    #
    #     async with aiohttp.ClientSession() as session:
    #         candles_list = await self.api_client.fetch_daily_candles_async(
    #             session=session,
    #             stock_code=stock_code,
    #             start_date=start_date,
    #             end_date=end_date,
    #             period_code='D'
    #         )
    #
    #     return [
    #         CandleDTO(
    #             stock_code=stock_code,
    #             interval_type='1d',
    #             candle_time=c['date'],
    #             open_price=c['open'],
    #             high_price=c['high'],
    #             low_price=c['low'],
    #             close_price=c['close'],
    #             volume=c['volume']
    #         )
    #         for c in candles_list
    #     ]

    # [미사용] 주봉 수집 - _collect_and_save_weekly_candles_direct 사용
    # async def _collect_weekly_candles(self, stock_code: str, days: int) -> List[CandleDTO]:
    #     start_date = (datetime.now() - timedelta(days=days)).strftime('%Y%m%d')
    #     end_date = datetime.now().strftime('%Y%m%d')
    #
    #     async with aiohttp.ClientSession() as session:
    #         candles_list = await self.api_client.fetch_daily_candles_async(
    #             session=session,
    #             stock_code=stock_code,
    #             start_date=start_date,
    #             end_date=end_date,
    #             period_code='W'  # 주봉
    #         )
    #
    #     return [
    #         CandleDTO(
    #             stock_code=stock_code,
    #             interval_type='1w',
    #             candle_time=c['date'],
    #             open_price=c['open'],
    #             high_price=c['high'],
    #             low_price=c['low'],
    #             close_price=c['close'],
    #             volume=c['volume']
    #         )
    #         for c in candles_list
    #     ]

    def close(self):
        if self.conn:
            self.conn.close()

    #병렬 처리
    async def collect_batch_parallel(
        self,
        stock_codes: List[str],
        interval_type: str,
        rate_limit: int = 20,
        batch_size: int = 100,
        days: int = None
    ) -> Dict[str, any]:

        start_time = time.time()
        limiter = HardRateLimiter(rate_limit)
        db_lock = asyncio.Lock()

        success_count = 0
        fail_count = 0
        total_candles = 0
        total_retries = 0

        total_batches = (len(stock_codes) + batch_size - 1) // batch_size

        connector = aiohttp.TCPConnector(limit=18)
        timeout = aiohttp.ClientTimeout(total=600)
        session = aiohttp.ClientSession(connector=connector, timeout=timeout)

        try:
            for batch_idx in range(total_batches):
                batch_stats = BatchRetryStats()
                batch_start = batch_idx * batch_size
                batch_end = min(batch_start + batch_size, len(stock_codes))
                batch_codes = stock_codes[batch_start:batch_end]

                if interval_type in ['5m', '30m']:
                    tasks = [
                        self._collect_and_save_minute_candles_direct(
                            session, stock_code, interval_type, limiter, db_lock
                        )
                        for stock_code in batch_codes
                    ]
                elif interval_type == '1d':
                    tasks = [
                        self._collect_and_save_daily_candles_direct(
                            session, stock_code, limiter, db_lock, days
                        )
                        for stock_code in batch_codes
                    ]
                elif interval_type == '1w':
                    tasks = [
                        self._collect_and_save_weekly_candles_direct(
                            session, stock_code, limiter, db_lock, days
                        )
                        for stock_code in batch_codes
                    ]
                else:
                    logger.error(f"지원하지 않는 interval_type: {interval_type}")
                    return {'success_count': 0, 'fail_count': len(stock_codes), 'total_candles': 0}

                results = await asyncio.gather(*tasks, return_exceptions=True)

                batch_candles = 0
                for result in results:
                    if isinstance(result, Exception):
                        fail_count += 1
                        batch_stats.record_fail()
                    elif result:
                        retries = result.get('retries', 0)
                        if result.get('success', 0) > 0:
                            success_count += result.get('success', 0)
                            batch_stats.record_success(retries)
                        else:
                            fail_count += result.get('fail', 0)
                            batch_stats.record_fail()
                        total_candles += result.get('candles', 0)
                        batch_candles += result.get('candles', 0)
                        total_retries += retries

                batch_stats.log_summary(f"{interval_type} 배치 {batch_idx + 1}/{total_batches} ({batch_candles}캔들)")

        finally:
            await session.close()

        elapsed = time.time() - start_time
        api_calls = limiter.get_call_count()

        return {
            'success_count': success_count,
            'fail_count': fail_count,
            'total_candles': total_candles,
            'total_retries': total_retries,
            'elapsed_time': elapsed,
            'api_calls': api_calls,
            'req_per_sec': api_calls / elapsed if elapsed > 0 else 0
        }

    #분봉(5m/30m) 수집
    async def _collect_and_save_minute_candles_direct(
        self,
        session: aiohttp.ClientSession,
        stock_code: str,
        interval_type: str,
        limiter: HardRateLimiter,
        db_lock: asyncio.Lock
    ) -> Dict[str, int]:
        try:
            days = self.RETENTION_DAYS[interval_type]
            minute_unit = 5 if interval_type == '5m' else 30
            all_candles = {}

            for i in range(days):
                target_date = (datetime.now() - timedelta(days=i)).date()
                date_str = target_date.strftime('%Y%m%d')

                result = await self.api_client.fetch_minute_candles_direct(
                    session, stock_code, date_str, limiter
                )
                if result:
                    all_candles.update(result)

            if not all_candles:
                # 분봉 데이터 없으면 가장 최근 캔들 복사
                async with db_lock:
                    db_conn = get_db_connection(None)
                    latest = get_latest_candle(db_conn, stock_code, interval_type)
                    if latest:
                        today = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
                        candle = CandleDTO(
                            stock_code=stock_code,
                            interval_type=interval_type,
                            candle_time=today,
                            open_price=latest['close_price'],
                            high_price=latest['close_price'],
                            low_price=latest['close_price'],
                            close_price=latest['close_price'],
                            volume=0
                        )
                        save_candles(db_conn, [candle])
                        db_conn.close()
                        name = self._get_stock_name(stock_code)
                        logger.info(f"{stock_code}({name}) {interval_type}: 분봉 없음 - 최근 캔들로 대체")
                        return {'success': 1, 'fail': 0, 'candles': 1, 'retries': 0}
                    db_conn.close()
                name = self._get_stock_name(stock_code)
                logger.warning(f"{stock_code}({name}) {interval_type}: 분봉 데이터 없음")
                return {'success': 0, 'fail': 1, 'candles': 0, 'retries': 0}

            aggregated = self._aggregate_candles(stock_code, interval_type, all_candles, minute_unit)

            if aggregated:
                async with db_lock:
                    db_conn = get_db_connection(None)
                    save_candles(db_conn, aggregated)
                    db_conn.close()

                return {'success': 1, 'fail': 0, 'candles': len(aggregated), 'retries': 0}
            else:
                # 집계된 캔들이 없으면 가장 최근 캔들 복사
                async with db_lock:
                    db_conn = get_db_connection(None)
                    latest = get_latest_candle(db_conn, stock_code, interval_type)
                    if latest:
                        today = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
                        candle = CandleDTO(
                            stock_code=stock_code,
                            interval_type=interval_type,
                            candle_time=today,
                            open_price=latest['close_price'],
                            high_price=latest['close_price'],
                            low_price=latest['close_price'],
                            close_price=latest['close_price'],
                            volume=0
                        )
                        save_candles(db_conn, [candle])
                        db_conn.close()
                        name = self._get_stock_name(stock_code)
                        logger.info(f"{stock_code}({name}) {interval_type}: 집계 없음 - 최근 캔들로 대체")
                        return {'success': 1, 'fail': 0, 'candles': 1, 'retries': 0}
                    db_conn.close()
                name = self._get_stock_name(stock_code)
                logger.warning(f"{stock_code}({name}) {interval_type}: 집계된 캔들 없음")
                return {'success': 0, 'fail': 1, 'candles': 0, 'retries': 0}

        except Exception as e:
            name = self._get_stock_name(stock_code)
            logger.error(f"{stock_code}({name}) {interval_type} 수집 실패: {e}")
            return {'success': 0, 'fail': 1, 'candles': 0, 'retries': 0}

    #일봉 수집 + 최신 종가로 stock_prices 저장
    async def _collect_and_save_daily_candles_direct(
        self,
        session: aiohttp.ClientSession,
        stock_code: str,
        limiter: HardRateLimiter,
        db_lock: asyncio.Lock,
        days: int = None
    ) -> Dict[str, int]:
        try:
            if days is None:
                days = self.RETENTION_DAYS['1d']
            start_date = (datetime.now() - timedelta(days=days)).strftime('%Y%m%d')
            end_date = datetime.now().strftime('%Y%m%d')

            candles_list = await self.api_client.fetch_daily_candles_direct(
                session, stock_code, start_date, end_date, 'D', limiter
            )

            candles = [
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

            if candles:
                async with db_lock:
                    db_conn = get_db_connection(None)
                    save_candles(db_conn, candles)

                    # 최신 일봉으로 stock_prices 저장 (초기화용)
                    if len(candles_list) >= 2:
                        # 최신 2개 일봉으로 등락 계산
                        latest = candles_list[0]  # 가장 최근
                        prev = candles_list[1]    # 전일
                        change_amount = latest['close'] - prev['close']
                        change_rate = round((change_amount / prev['close']) * 100, 2) if prev['close'] > 0 else 0
                    elif len(candles_list) == 1:
                        latest = candles_list[0]
                        change_amount = 0
                        change_rate = 0
                    else:
                        latest = None

                    if latest:
                        stock_dto = StockDTO(
                            stock_code=stock_code,
                            stock_name='',
                            current_price=latest['close'],
                            change_amount=change_amount,
                            change_rate=change_rate,
                            volume=latest['volume'],
                            trading_value=latest.get('trading_value', 0)
                        )
                        save_stock_price(db_conn, stock_dto)

                    db_conn.close()

                return {'success': 1, 'fail': 0, 'candles': len(candles), 'retries': 0}
            else:
                # 일봉 데이터 없으면 가장 최근 일봉 복사
                async with db_lock:
                    db_conn = get_db_connection(None)
                    latest = get_latest_candle(db_conn, stock_code, '1d')
                    if latest:
                        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                        candle = CandleDTO(
                            stock_code=stock_code,
                            interval_type='1d',
                            candle_time=today,
                            open_price=latest['close_price'],
                            high_price=latest['close_price'],
                            low_price=latest['close_price'],
                            close_price=latest['close_price'],
                            volume=0
                        )
                        save_candles(db_conn, [candle])
                        db_conn.close()
                        name = self._get_stock_name(stock_code)
                        logger.info(f"{stock_code}({name}) 1d: 최근 캔들로 대체")
                        return {'success': 1, 'fail': 0, 'candles': 1, 'retries': 0}
                    db_conn.close()
                name = self._get_stock_name(stock_code)
                logger.warning(f"{stock_code}({name}) 1d: 일봉 데이터 없음")
                return {'success': 0, 'fail': 1, 'candles': 0, 'retries': 0}

        except Exception as e:
            name = self._get_stock_name(stock_code)
            logger.error(f"{stock_code}({name}) 1d 수집 실패: {e}")
            return {'success': 0, 'fail': 1, 'candles': 0, 'retries': 0}

    #주봉 수집
    async def _collect_and_save_weekly_candles_direct(
        self,
        session: aiohttp.ClientSession,
        stock_code: str,
        limiter: HardRateLimiter,
        db_lock: asyncio.Lock,
        days: int = None
    ) -> Dict[str, int]:
        try:
            if days is None:
                days = self.RETENTION_DAYS['1w']
            start_date = (datetime.now() - timedelta(days=days)).strftime('%Y%m%d')
            end_date = datetime.now().strftime('%Y%m%d')

            candles_list = await self.api_client.fetch_daily_candles_direct(
                session, stock_code, start_date, end_date, 'W', limiter
            )

            candles = [
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

            if candles:
                async with db_lock:
                    db_conn = get_db_connection(None)
                    save_candles(db_conn, candles)
                    db_conn.close()

                return {'success': 1, 'fail': 0, 'candles': len(candles), 'retries': 0}
            else:
                # 주봉 데이터 없으면 가장 최근 주봉 복사
                async with db_lock:
                    db_conn = get_db_connection(None)
                    latest = get_latest_candle(db_conn, stock_code, '1w')
                    if latest:
                        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                        candle = CandleDTO(
                            stock_code=stock_code,
                            interval_type='1w',
                            candle_time=today,
                            open_price=latest['close_price'],
                            high_price=latest['close_price'],
                            low_price=latest['close_price'],
                            close_price=latest['close_price'],
                            volume=0
                        )
                        save_candles(db_conn, [candle])
                        db_conn.close()
                        name = self._get_stock_name(stock_code)
                        logger.info(f"{stock_code}({name}) 1w: 최근 캔들로 대체")
                        return {'success': 1, 'fail': 0, 'candles': 1, 'retries': 0}
                    db_conn.close()
                name = self._get_stock_name(stock_code)
                logger.warning(f"{stock_code}({name}) 1w: 주봉 데이터 없음")
                return {'success': 0, 'fail': 1, 'candles': 0, 'retries': 0}

        except Exception as e:
            name = self._get_stock_name(stock_code)
            logger.error(f"{stock_code}({name}) 1w 수집 실패: {e}")
            return {'success': 0, 'fail': 1, 'candles': 0, 'retries': 0}
