import os
import sys
import time
import pymysql
import asyncio
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.main as main_module
from app.main import (
    check_and_initialize,
    update_financials,
    weekly_update,
    run_rest_collection_loop,
    run_volume_rank_loop
)
from app.volume_tracker import VolumeTracker
from collector.websocket_collector import WebSocketCollector
from collector.candle_filler import CandleFiller
from collector.candle_collector import CandleCollector
from config.config import DB_CONFIG, REDIS_KEYS
from core.token_manager import TokenManager
from utils.logger import logger


# 1. 서버 초기화 (main.py의 check_and_initialize 사용)
async def test_initialize():
    await check_and_initialize(rate_limit=18)


# 2. 재무 데이터 업데이트 (main.py의 update_financials 사용)
async def test_update_financials():
    await update_financials(rate_limit=18, batch_size=100)


# 3. 장 시작 (웹소켓 + REST 수집) - main.py 전역변수/함수 사용
async def test_start_collection():
    if main_module.collection_active:
        logger.warning("이미 수집 중")
        return

    logger.info("장 시작")

    main_module.token_manager = TokenManager.get_instance()
    main_module.volume_tracker = VolumeTracker(main_module.token_manager)
    main_module.ws_collector = WebSocketCollector(main_module.token_manager)

    main_module.ws_collector.connect()
    top_10_stocks = await main_module.volume_tracker.get_top_volume_stocks()
    if top_10_stocks:
        main_module.ws_collector.subscribe_stocks(top_10_stocks)
        logger.info(f"초기 구독 완료: {len(top_10_stocks)}개 종목")

    main_module.collection_active = True

    main_module.rest_loop_task = asyncio.create_task(run_rest_collection_loop())
    main_module.candle_loop_task = asyncio.create_task(run_volume_rank_loop())

    try:
        while main_module.collection_active:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        pass

#수집 중지
async def test_stop_collection():
    if not main_module.collection_active:
        logger.warning("수집 실행 중 아님")
        return

    logger.info("수집 중지")
    main_module.collection_active = False

    if main_module.rest_loop_task:
        main_module.rest_loop_task.cancel()
        try:
            await main_module.rest_loop_task
        except asyncio.CancelledError:
            pass

    if main_module.candle_loop_task:
        main_module.candle_loop_task.cancel()
        try:
            await main_module.candle_loop_task
        except asyncio.CancelledError:
            pass

    await asyncio.sleep(1)

    if main_module.volume_tracker:
        await main_module.volume_tracker.close()

    if main_module.ws_collector:
        main_module.ws_collector.close()

    logger.info("수집 중지 완료")


# 4. 장 마감 (누락 보정 + 일봉 수집) - target_date 유연 처리
def get_last_trading_date():
    now = datetime.now()
    target = now.date()

    if now.hour < 9:
        target = target - timedelta(days=1)

    while target.weekday() >= 5:
        target = target - timedelta(days=1)

    return target


async def test_end_of_day():
    start_time = time.time()
    logger.info("장 마감 처리 시작")

    tm = TokenManager.get_instance()

    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute("SELECT stock_code FROM stock")
    stocks = [row[0] for row in cursor.fetchall()]
    conn.close()

    if not stocks:
        logger.warning("대상 종목이 없습니다.")
        tm.close()
        return

    target_date = get_last_trading_date()
    logger.info(f"전체 종목: {len(stocks)}개, 대상 날짜: {target_date}")

    fill_result = await CandleFiller.fill_missing_candles_parallel(
        token_manager=tm,
        stock_codes=stocks,
        rate_limit=18,
        fill_1m=True,
        fill_5m=True,
        fill_30m=True,
        batch_size=100,
        target_date=target_date
    )
    logger.info(f"누락 보정: {fill_result['success_count']}성공, {fill_result['fail_count']}실패, {fill_result['elapsed_time']:.1f}초")

    candle_collector = CandleCollector(tm)
    result = await candle_collector.collect_batch_parallel(
        stock_codes=stocks,
        interval_type='1d',
        rate_limit=18,
        batch_size=100
    )
    logger.info(f"일봉 수집: {result['success_count']}성공, {result['fail_count']}실패, {result['elapsed_time']:.1f}초")

    candle_collector.close()
    tm.close()

    elapsed = time.time() - start_time
    logger.info(f"장 마감 처리 완료: {elapsed:.1f}초")


# 5. 주봉 업데이트 (main.py의 weekly_update 사용)
async def test_weekly_update():
    """주봉 업데이트 - main.py의 weekly_update 호출"""
    await weekly_update()


# 6. 유저 조회 종목 100개 저장
def setup_user_stocks():
    logger.info("조회 종목 100개 저장 시작")

    try:
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("SELECT stock_code FROM stock LIMIT 100")
        stocks = [row[0] for row in cursor.fetchall()]
        conn.close()

        if not stocks:
            logger.error("종목이 없습니다. 먼저 서버 초기화를 실행하세요.")
            return

        tm = TokenManager.get_instance()
        redis_client = tm.redis_client
        user_stocks_key = REDIS_KEYS['user_stocks']

        existing_keys = redis_client.keys(f"{user_stocks_key}:*")
        if existing_keys:
            redis_client.delete(*existing_keys)
            logger.info(f"기존 유저 종목 {len(existing_keys)}개 삭제")

        for stock_code in stocks:
            key = f"{user_stocks_key}:{stock_code}"
            redis_client.set(key, "1")

        tm.close()

        logger.info(f"유저 조회 종목 {len(stocks)}개 저장 완료")
        logger.info(f"저장 형식: {user_stocks_key}:{{stock_code}}")
        logger.info(f"예시: {user_stocks_key}:{stocks[0]}")

    except Exception as e:
        logger.error(f"유저 종목 저장 실패: {e}")
        import traceback
        traceback.print_exc()


def print_menu():
    print("\n" + "=" * 50)
    print("  메인 테스트 (main.py 함수 재사용)")
    print("=" * 50)
    print("  1. 서버 초기화 (종목 파싱 + 30분봉/일봉/주봉)")
    print("  2. 재무 데이터 업데이트")
    print("  3. 장 시작 (웹소켓 + REST 실시간 수집)")
    print("  4. 장 마감 (누락 보정 + 일봉 수집)")
    print("  5. 주봉 업데이트")
    print("  6. 유저 조회 종목 100개 저장")
    print("  0. 종료")
    print("=" * 50)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='메인 테스트')
    parser.add_argument('--mode', '-m', type=int, default=-1,
                        help='실행 모드 (1~6)')

    args = parser.parse_args()

    if args.mode == -1:
        print_menu()
        choice = input("선택: ").strip()
    else:
        choice = str(args.mode)

    if choice == "1":
        asyncio.run(test_initialize())
    elif choice == "2":
        asyncio.run(test_update_financials())
    elif choice == "3":
        try:
            asyncio.run(test_start_collection())
        except KeyboardInterrupt:
            logger.info("Ctrl+C - 종료")
    elif choice == "4":
        asyncio.run(test_end_of_day())
    elif choice == "5":
        asyncio.run(test_weekly_update())
    elif choice == "6":
        setup_user_stocks()
    elif choice == "0":
        print("종료")
    else:
        print("잘못된 선택입니다.")
