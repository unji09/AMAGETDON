import os
import sys
import asyncio
import pymysql
import time
import aiohttp
from datetime import datetime, timedelta

# 프로젝트 루트를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.token_manager import TokenManager
from utils.kis_api_client import KISApiClient
from config.config import DB_CONFIG
from models.dto import CandleDTO
from utils.db import get_db_connection, save_candles

RETENTION_DAYS = {
    '1d': 90,
    '1w': 365
}


async def fetch_daily_weekly_candle(session, api_client, stock_code, interval_type):
    """일봉/주봉 단일 종목 조회"""
    try:
        days = RETENTION_DAYS[interval_type]
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y%m%d')
        end_date = datetime.now().strftime('%Y%m%d')
        period_code = 'D' if interval_type == '1d' else 'W'

        candles_list = await api_client.fetch_daily_candles_async(
            session=session,
            stock_code=stock_code,
            start_date=start_date,
            end_date=end_date,
            period_code=period_code
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


async def test_daily_weekly(interval_type: str, stock_count: int = 100, save_to_db: bool = False):
    """일봉/주봉 조회 테스트 (병렬)"""

    if interval_type not in ['1d', '1w']:
        print(f"지원하지 않는 interval: {interval_type}. (1d, 1w만 가능)")
        return

    print("=" * 60)
    print(f"{'일봉' if interval_type == '1d' else '주봉'} 조회 테스트 (병렬)")
    print("=" * 60)

    # DB에서 종목 가져오기
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute(f"SELECT stock_code FROM stock LIMIT {stock_count}")
    stocks = [row[0] for row in cursor.fetchall()]
    conn.close()

    print(f"테스트 대상: {len(stocks)}개 종목")
    print(f"수집 기간: {RETENTION_DAYS[interval_type]}일")
    print("-" * 60)

    token_manager = TokenManager.get_instance()
    api_client = KISApiClient(token_manager)

    # 초당 요청 수 (CANDLE API 제한: 2건)
    BATCH_SIZE = 2

    start_time = datetime.now()
    success_count = 0
    fail_count = 0
    total_candles = 0
    all_results = []

    try:
        connector = aiohttp.TCPConnector(limit=10)
        timeout = aiohttp.ClientTimeout(total=60)
        session = aiohttp.ClientSession(connector=connector, timeout=timeout)

        # 배치 단위로 처리
        for i in range(0, len(stocks), BATCH_SIZE):
            batch_start = time.time()
            batch = stocks[i:i + BATCH_SIZE]

            tasks = [
                fetch_daily_weekly_candle(session, api_client, code, interval_type)
                for code in batch
            ]
            results = await asyncio.gather(*tasks)
            all_results.extend(results)

            # 1초 대기 보장
            elapsed = time.time() - batch_start
            if elapsed < 1.0 and i + BATCH_SIZE < len(stocks):
                await asyncio.sleep(1.0 - elapsed)

            print(f"  배치 {i // BATCH_SIZE + 1}/{(len(stocks) + BATCH_SIZE - 1) // BATCH_SIZE} 완료")

        # 결과 출력 및 DB 저장
        db_conn = None
        if save_to_db:
            db_conn = get_db_connection(None)

        for stock_code, candles in all_results:
            if candles:
                if save_to_db and db_conn:
                    save_candles(db_conn, candles)
                print(f"✓ {stock_code}: {len(candles)}개 캔들")
                success_count += 1
                total_candles += len(candles)
            else:
                print(f"✗ {stock_code}: 데이터 없음")
                fail_count += 1

        if db_conn:
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

    print("-" * 60)
    print(f"테스트 완료 [{'일봉' if interval_type == '1d' else '주봉'}]")
    print(f"  - 성공: {success_count}개")
    print(f"  - 실패: {fail_count}개")
    print(f"  - 총 캔들: {total_candles}개")
    print(f"  - 소요시간: {elapsed:.2f}초")
    print(f"  - 평균: {elapsed/len(stocks):.3f}초/종목")
    print("=" * 60)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='일봉/주봉 조회 테스트')
    parser.add_argument('--interval', '-i', type=str, default='1d',
                        help='조회할 interval (1d: 일봉, 1w: 주봉, 기본: 1d)')
    parser.add_argument('--count', '-c', type=int, default=100,
                        help='테스트할 종목 수 (기본: 100)')
    parser.add_argument('--save', '-s', action='store_true',
                        help='DB에 저장 여부 (기본: False)')

    args = parser.parse_args()
    asyncio.run(test_daily_weekly(args.interval, args.count, args.save))
