import os
import sys
import asyncio
import pymysql
import time
import aiohttp
from datetime import datetime, timedelta
from typing import Optional, Set

# 프로젝트 루트를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.token_manager import TokenManager
from utils.kis_api_client import KISApiClient
from models.dto import CandleDTO
from utils.db import get_db_connection, save_candles
from config.config import DB_CONFIG

RETENTION_DAYS = {
    '5m': 1,
    '30m': 7,
    '1d': 90,
    '1w': 365
}


class HardRateLimiter:
    """Hard Rate Limiter - 콜 간격을 강제로 고정 (금융 API 친화적)"""

    def __init__(self, rate_per_second: int):
        self._interval = 1.0 / rate_per_second
        self._last_call = 0
        self._lock = asyncio.Lock()
        self._call_count = 0

    async def acquire(self):
        async with self._lock:
            now = time.time()
            wait = self._interval - (now - self._last_call)
            if wait > 0:
                await asyncio.sleep(wait)
            self._last_call = time.time()
            self._call_count += 1

    def get_call_count(self):
        return self._call_count


async def safe_get(session, url, headers, params, retries=3):
    """retry + exponential backoff"""
    for i in range(retries):
        try:
            async with session.get(url, headers=headers, params=params) as resp:
                return await resp.json()
        except Exception as e:
            if i == retries - 1:
                raise
            await asyncio.sleep(1.5 ** i)


async def fetch_minute_candles_with_limiter(
    session: aiohttp.ClientSession,
    api_client: KISApiClient,
    stock_code: str,
    target_date: str,
    limiter: HardRateLimiter,
    start_time: str = "090000",
    end_time: str = "153000",
) -> dict:
    """일별분봉 조회 - 외부 limiter 사용 (내부 limiter 우회)"""

    base_url = api_client.base_url
    candles = {}
    current_time = end_time
    max_pages = 50

    for page in range(max_pages):
        await limiter.acquire()

        headers = api_client._get_headers("FHKST03010230", use_candle_api=True)
        params = {
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD": stock_code,
            "FID_INPUT_HOUR_1": current_time,
            "FID_INPUT_DATE_1": target_date,
            "FID_PW_DATA_INCU_YN": "Y",
            "FID_FAKE_TICK_INCU_YN": " "
        }

        try:
            url = f"{base_url}/uapi/domestic-stock/v1/quotations/inquire-time-dailychartprice"
            data = await safe_get(session, url, headers, params)

            if data.get("rt_cd") != "0":
                if "token" in data.get("msg1", "").lower():
                    await limiter.acquire()
                    api_client.token_manager.refresh_token("candle")
                    headers = api_client._get_headers("FHKST03010230", use_candle_api=True)
                    data = await safe_get(session, url, headers, params)
                else:
                    break

            if data.get("rt_cd") != "0":
                break

            outputs = data.get("output2", [])
            if not outputs:
                break

            oldest_time = None
            for item in outputs:
                date_str = item.get('stck_bsop_date', '')
                time_str = item.get('stck_cntg_hour', '')

                if not date_str or not time_str:
                    continue

                if date_str != target_date:
                    continue

                oldest_time = time_str

                candle_time = datetime.strptime(
                    date_str + time_str[:4] + "00",
                    '%Y%m%d%H%M%S'
                )

                if candle_time in candles:
                    continue

                open_price = int(item.get('stck_oprc', 0))
                close_price = int(item.get('stck_prpr', 0))

                if open_price <= 0 or close_price <= 0:
                    continue

                candles[candle_time] = {
                    'open': open_price,
                    'high': int(item.get('stck_hgpr', 0)),
                    'low': int(item.get('stck_lwpr', 0)),
                    'close': close_price,
                    'volume': int(item.get('cntg_vol', 0))
                }

            if oldest_time:
                if oldest_time <= start_time:
                    break
                oldest_dt = datetime.strptime(oldest_time, '%H%M%S')
                next_time = (oldest_dt - timedelta(minutes=1)).strftime('%H%M%S')
                current_time = next_time
            else:
                break

        except Exception as e:
            print(f"  [ERROR] {stock_code} {target_date}: {e}")
            break

    return candles


async def fetch_daily_candles_with_limiter(
    session: aiohttp.ClientSession,
    api_client: KISApiClient,
    stock_code: str,
    start_date: str,
    end_date: str,
    period_code: str,
    limiter: HardRateLimiter
) -> list:
    """일봉/주봉 조회 - 외부 limiter 사용"""

    base_url = api_client.base_url
    candles = []
    tr_cont = ""
    max_pages = 10 if period_code == 'D' else 5

    for page in range(max_pages):
        await limiter.acquire()

        headers = api_client._get_headers("FHKST03010100", use_candle_api=True)
        params = {
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD": stock_code,
            "FID_INPUT_DATE_1": start_date,
            "FID_INPUT_DATE_2": end_date,
            "FID_PERIOD_DIV_CODE": period_code,
            "FID_ORG_ADJ_PRC": "0"
        }

        if tr_cont:
            headers["tr_cont"] = tr_cont

        try:
            url = f"{base_url}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice"
            data = await safe_get(session, url, headers, params)

            if data.get("rt_cd") != "0":
                if "token" in data.get("msg1", "").lower():
                    api_client.token_manager.refresh_token("candle")
                    headers = api_client._get_headers("FHKST03010100", use_candle_api=True)
                    data = await safe_get(session, url, headers, params)
                else:
                    break

            if data.get("rt_cd") != "0":
                break

            outputs = data.get("output2", [])
            if not outputs:
                break

            for item in outputs:
                date_str = item.get('stck_bsop_date', '')
                if not date_str:
                    continue

                open_price = int(item.get('stck_oprc', 0))
                close_price = int(item.get('stck_clpr', 0))

                if open_price == 0 or close_price == 0:
                    continue

                candles.append({
                    'date': datetime.strptime(date_str, '%Y%m%d'),
                    'open': open_price,
                    'high': int(item.get('stck_hgpr', 0)),
                    'low': int(item.get('stck_lwpr', 0)),
                    'close': close_price,
                    'volume': int(item.get('acml_vol', 0))
                })

            tr_cont = data.get("tr_cont", "")
            if tr_cont not in ("D", "M"):
                break

        except Exception as e:
            print(f"  [ERROR] {stock_code}: {e}")
            break

    return candles


async def fetch_minute_candle_task(session, api_client, stock_code, target_date_str, limiter):
    """분봉 단일 일자 수집 태스크"""
    try:
        candles_dict = await fetch_minute_candles_with_limiter(
            session, api_client, stock_code, target_date_str, limiter
        )
        return stock_code, target_date_str, candles_dict
    except Exception as e:
        return stock_code, target_date_str, None


async def fetch_daily_candle_task(session, api_client, stock_code, interval_type, limiter):
    """일봉/주봉 단일 종목 수집 태스크"""
    try:
        days = RETENTION_DAYS[interval_type]
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y%m%d')
        end_date = datetime.now().strftime('%Y%m%d')
        period_code = 'D' if interval_type == '1d' else 'W'

        candles_list = await fetch_daily_candles_with_limiter(
            session, api_client, stock_code, start_date, end_date, period_code, limiter
        )

        candles = [
            CandleDTO(
                stock_code=stock_code,
                interval_type=interval_type,
                candle_time=c['date'],
                open_price=c['open'],
                high_price=c['high'],
                low_price=c['low'],
                close_price=c['close'],
                volume=c['volume']
            )
            for c in candles_list
        ]
        return stock_code, candles
    except Exception as e:
        print(f"  [ERROR] {stock_code}: {e}")
        return stock_code, []


def aggregate_candles(stock_code, interval_type, candles_dict, minute_unit):
    """1분봉 -> N분봉 집계"""
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
                agg_candle = create_aggregated_candle(
                    stock_code, interval_type, current_slot_time,
                    current_group_times, candles_dict
                )
                if agg_candle:
                    aggregated.append(agg_candle)

            current_slot_time = slot_time
            current_group_times = [candle_time]
        else:
            current_group_times.append(candle_time)

    if current_group_times:
        agg_candle = create_aggregated_candle(
            stock_code, interval_type, current_slot_time,
            current_group_times, candles_dict
        )
        if agg_candle:
            aggregated.append(agg_candle)

    return aggregated


def create_aggregated_candle(stock_code, interval_type, slot_time, group_times, candles_dict):
    """집계 캔들 생성"""
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
        return None


async def test_candle_parallel(interval_type: str, stock_count: int = 100, rate_limit: int = 20):
    """병렬 캔들 수집 테스트"""

    print("=" * 60)
    print(f"캔들 수집 테스트 (병렬) - {interval_type}")
    print("=" * 60)

    # DB에서 종목 가져오기
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute(f"SELECT stock_code FROM stock LIMIT {stock_count}")
    stocks = [row[0] for row in cursor.fetchall()]
    conn.close()

    days = RETENTION_DAYS[interval_type]

    print(f"테스트 대상: {len(stocks)}개 종목")
    print(f"수집 기간: {days}일")
    print(f"Rate Limit: 초당 {rate_limit}건 (페이징 포함)")
    print("-" * 60)

    token_manager = TokenManager.get_instance()
    api_client = KISApiClient(token_manager)

    # Hard Rate Limiter (콜 간격 강제)
    limiter = HardRateLimiter(rate_limit)

    start_time = datetime.now()
    success_count = 0
    fail_count = 0
    total_candles = 0

    try:
        connector = aiohttp.TCPConnector(limit=5)
        timeout = aiohttp.ClientTimeout(total=600)
        session = aiohttp.ClientSession(connector=connector, timeout=timeout)

        if interval_type in ['1d', '1w']:
            # 일봉/주봉: 종목별로 병렬 호출 (동시 실행 제한)
            CONCURRENT_LIMIT = 10
            semaphore = asyncio.Semaphore(CONCURRENT_LIMIT)

            async def limited_fetch_daily(code):
                async with semaphore:
                    return await fetch_daily_candle_task(session, api_client, code, interval_type, limiter)

            tasks = [limited_fetch_daily(code) for code in stocks]
            all_results = await asyncio.gather(*tasks)

            # DB 저장
            db_conn = get_db_connection(None)
            for stock_code, candles in all_results:
                if candles:
                    save_candles(db_conn, candles)
                    print(f"✓ {stock_code}: {len(candles)}개 캔들 저장")
                    success_count += 1
                    total_candles += len(candles)
                else:
                    print(f"✗ {stock_code}: 데이터 없음")
                    fail_count += 1
            db_conn.close()

        else:
            # 분봉: 종목 x 일자 조합을 배치로 처리
            minute_unit = 30 if interval_type == '30m' else 5

            # 모든 (종목, 날짜) 조합 생성
            requests = []
            for stock_code in stocks:
                for i in range(days):
                    target_date = (datetime.now() - timedelta(days=i)).date()
                    target_date_str = target_date.strftime('%Y%m%d')
                    requests.append((stock_code, target_date_str))

            print(f"총 요청 수: {len(requests)}건 (종목x일자, 페이징은 별도)")

            # 동시 실행 제한 (세션 연결 수 제한)
            CONCURRENT_LIMIT = 10
            semaphore = asyncio.Semaphore(CONCURRENT_LIMIT)

            async def limited_fetch(code, date_str):
                async with semaphore:
                    return await fetch_minute_candle_task(session, api_client, code, date_str, limiter)

            tasks = [limited_fetch(code, date_str) for code, date_str in requests]
            results = await asyncio.gather(*tasks)

            # 종목별로 결과 집계
            stock_candles = {code: {} for code in stocks}
            for stock_code, date_str, candles_dict in results:
                if candles_dict:
                    stock_candles[stock_code].update(candles_dict)

            # 집계 및 저장
            db_conn = get_db_connection(None)
            for stock_code in stocks:
                all_candles = stock_candles[stock_code]
                if all_candles:
                    candles = aggregate_candles(stock_code, interval_type, all_candles, minute_unit)
                    if candles:
                        save_candles(db_conn, candles)
                        print(f"✓ {stock_code}: {len(candles)}개 캔들 저장")
                        success_count += 1
                        total_candles += len(candles)
                    else:
                        print(f"✗ {stock_code}: 집계 실패")
                        fail_count += 1
                else:
                    print(f"✗ {stock_code}: 데이터 없음")
                    fail_count += 1
            db_conn.close()

    except Exception as e:
        print(f"에러 발생: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await session.close()
        await api_client.close()
        token_manager.close()

    elapsed = (datetime.now() - start_time).total_seconds()
    actual_api_calls = limiter.get_call_count()

    print("-" * 60)
    print(f"테스트 완료 [{interval_type}]")
    print(f"  - 성공: {success_count}개")
    print(f"  - 실패: {fail_count}개")
    print(f"  - 총 캔들: {total_candles}개")
    print(f"  - 실제 API 호출: {actual_api_calls}건")
    print(f"  - 소요시간: {elapsed:.2f}초")
    print(f"  - 실제 처리량: {actual_api_calls / elapsed:.1f}건/초")
    print("=" * 60)


async def test_all_intervals(stock_count: int = 100, rate_limit: int = 20):
    """전체 interval 테스트"""

    print("=" * 60)
    print("전체 캔들 수집 테스트 (병렬)")
    print("=" * 60)

    intervals = ['30m', '1d', '1w']
    total_start = datetime.now()

    for interval in intervals:
        await test_candle_parallel(interval, stock_count, rate_limit)
        print("\n")

    total_elapsed = (datetime.now() - total_start).total_seconds()
    print(f"전체 완료: {total_elapsed:.2f}초")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='캔들 수집 테스트 (병렬)')
    parser.add_argument('--interval', '-i', type=str, default=None,
                        help='테스트할 interval (30m, 1d, 1w). 미지정시 전체 테스트')
    parser.add_argument('--count', '-c', type=int, default=100,
                        help='테스트할 종목 수 (기본: 100)')
    parser.add_argument('--rate', '-r', type=int, default=20,
                        help='초당 요청 수 제한 (기본: 20)')

    args = parser.parse_args()

    if args.interval:
        asyncio.run(test_candle_parallel(args.interval, args.count, args.rate))
    else:
        asyncio.run(test_all_intervals(args.count, args.rate))
