import os
import sys
import asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import (
    check_and_initialize,
    update_financials,
    start_collection,
    stop_collection,
    weekly_update
)
from config.config import REDIS_KEYS
from core.token_manager import TokenManager
from utils.logger import logger
import pymysql
from config.config import DB_CONFIG


# 1. 서버 초기화 (main.py의 check_and_initialize 사용)
async def test_initialize():
    await check_and_initialize(rate_limit=18)


# 2. 재무 데이터 업데이트 (main.py의 update_financials 사용)
async def test_update_financials():
    await update_financials(rate_limit=18, batch_size=100)


# 3. 장 시작 (main.py의 start_collection 사용)
async def test_start_collection():
    await start_collection()

    # 수집 유지 (Ctrl+C로 종료)
    try:
        while True:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        pass


# 4. 장 마감 (main.py의 stop_collection 사용)
async def test_stop_collection():
    await stop_collection(rate_limit=18)


# 5. 주봉 업데이트 (main.py의 weekly_update 사용)
async def test_weekly_update():
    await weekly_update()


# 6. 유저 조회 종목 100개 저장 (테스트용)
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
        asyncio.run(test_stop_collection())
    elif choice == "5":
        asyncio.run(test_weekly_update())
    elif choice == "6":
        setup_user_stocks()
    elif choice == "0":
        print("종료")
    else:
        print("잘못된 선택입니다.")
