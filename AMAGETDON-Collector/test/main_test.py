import time
import pymysql
import threading
import asyncio
from app.volume_tracker import VolumeTracker
from collector.realtime_collector import RealtimeCollector
from collector.candle_filler import CandleFiller
from collector.candle_collector import CandleCollector
from collector.websocket_collector import WebSocketCollector
from config.config import DB_CONFIG
from core.stock_manager import StockManager
from core.token_manager import TokenManager
from utils.logger import logger
from utils.kis_api_client import KISApiClient

# 전역 변수
token_manager = None
ws_collector = None
rest_collector = None
volume_tracker = None
collection_active = False


def get_stocks(limit=100):
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute(f"SELECT stock_code FROM stock LIMIT {limit}")
    stocks = [row[0] for row in cursor.fetchall()]
    conn.close()
    return stocks


# 1. 서버 시작 시 초기화
def test_check_and_initialize():
    total_start = time.time()
    logger.info("=== 초기화 테스트 시작 ===")

    try:
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("SELECT stock_code FROM stock LIMIT 100")
        stocks = [row[0] for row in cursor.fetchall()]
        conn.close()

        logger.info(f"종목 데이터: {len(stocks)}개")
        logger.info("과거 캔들 데이터 체크 시작")

        tm = TokenManager.get_instance()
        candle_collector = CandleCollector(tm)

        async def collect_all():
            for interval in ['30m', '1d', '1w']:
                start = time.time()
                logger.info(f"{interval} 수집 시작")
                await candle_collector.collect_batch_async(stocks, interval)
                elapsed = time.time() - start
                logger.info(f"{interval} 수집 완료 (소요: {elapsed:.2f}초)")

        asyncio.run(collect_all())

        candle_collector.close()
        tm.close()
        total_elapsed = time.time() - total_start
        logger.info(f"=== 초기화 테스트 완료 (총 소요: {total_elapsed:.2f}초) ===")
            
    except Exception as e:
        logger.error(f"초기화 테스트 실패: {e}")
        raise


# 2. 재무 데이터 업데이트
def test_update_financials():
    total_start = time.time()
    logger.info("=== 재무 데이터 테스트 시작 ===")

    try:
        tm = TokenManager.get_instance()
        api_client = KISApiClient(tm)

        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()

        cursor.execute("SELECT stock_code FROM stock LIMIT 100")
        stocks = [row[0] for row in cursor.fetchall()]

        logger.info(f"총 {len(stocks)}개 종목 재무 데이터 수집 시작")

        success = 0
        fail = 0
        batch_size = 100

        for i in range(0, len(stocks), batch_size):
            batch = stocks[i:i + batch_size]

            try:
                results = asyncio.run(api_client.fetch_prices_batch(batch))

                for stock_code in batch:
                    stock = results.get(stock_code)
                    if stock:
                        cursor.execute("""
                            UPDATE stock
                            SET per=%s, pbr=%s, eps=%s, bps=%s, market_cap=%s, updated_at=NOW()
                            WHERE stock_code=%s
                        """, (stock.per, stock.pbr, stock.eps, stock.bps, stock.market_cap, stock_code))
                        success += 1
                    else:
                        fail += 1

                conn.commit()
                logger.info(f"진행: {min(i + batch_size, len(stocks))}/{len(stocks)} (성공: {success}, 실패: {fail})")

            except Exception as e:
                fail += len(batch)
                logger.error(f"배치 처리 실패: {e}")

        conn.commit()
        conn.close()
        tm.close()

        total_elapsed = time.time() - total_start
        logger.info(f"=== 재무 데이터 테스트 완료 - 성공: {success}, 실패: {fail} (소요: {total_elapsed:.2f}초) ===")
        
    except Exception as e:
        logger.error(f"재무 데이터 테스트 실패: {e}")


# 3. 장 시작
def test_start_collection(duration_seconds=60):
    global token_manager, ws_collector, rest_collector, volume_tracker, collection_active

    logger.info(f"=== 장 시작 테스트 ({duration_seconds}초) ===")

    token_manager = TokenManager.get_instance()

    stocks = get_stocks(100)
    redis_client = token_manager.redis_client
    for stock_code in stocks:
        redis_key = f"kis:user_stocks:{stock_code}"
        redis_client.set(redis_key, "1")
        redis_client.expire(redis_key, 300)
    logger.info(f"Redis에 {len(stocks)}개 종목 등록 (5분 만료)")

    volume_tracker = VolumeTracker(token_manager)
    ws_collector = WebSocketCollector(token_manager)
    stock_manager = StockManager(token_manager.redis_client)
    rest_collector = RealtimeCollector(token_manager, stock_manager)
    
    ws_collector.connect()
    top_10_stocks = volume_tracker.get_top_volume_stocks()
    if top_10_stocks:
        ws_collector.subscribe_stocks(top_10_stocks)
        logger.info(f"초기 구독 완료: {len(top_10_stocks)}개 종목")
    
    collection_active = True
    
    # 웹소켓 스레드 (5분마다 거래량 순위 갱신)
    def run_websocket_collector():
        while collection_active:
            time.sleep(300)
            if not ws_collector.ws:
                ws_collector.connect()
            
            stocks = volume_tracker.get_top_volume_stocks()
            if stocks and ws_collector.ws:
                ws_collector.subscribe_stocks(stocks)
    
    ws_thread = threading.Thread(target=run_websocket_collector, daemon=True)
    ws_thread.start()
    
    rest_thread = threading.Thread(target=rest_collector.collect, daemon=True)
    rest_thread.start()
    
    logger.info(f"{duration_seconds}초 동안 수집 진행...")
    time.sleep(duration_seconds)
    
    test_stop_collection()


# 4. 장 마감
def test_stop_collection():
    global collection_active, ws_collector, rest_collector, token_manager

    total_start = time.time()
    logger.info("=== 장 마감 테스트 ===")

    collection_active = False
    time.sleep(1)

    if rest_collector:
        rest_collector.close()

    logger.info("장 마감 후 데이터 업데이트 시작")
    stock_manager = StockManager(token_manager.redis_client)
    stocks = stock_manager.get_all_target_stocks()

    if not stocks:
        stocks = get_stocks(100)

    async def process_all_stocks():
        candle_collector = CandleCollector(token_manager)

        fill_start = time.time()
        logger.info(f"누락 캔들 보정 시작 ({len(stocks)}개 종목)")
        for stock_code in stocks:
            try:
                filler = CandleFiller(token_manager)
                await filler.fill_missing_candles(
                    stock_code=stock_code,
                    fill_1m=True,
                    fill_5m=True,
                    fill_30m=True
                )
                filler.close()
            except Exception as e:
                logger.error(f"{stock_code} 캔들 보정 실패: {e}")
        fill_elapsed = time.time() - fill_start
        logger.info(f"누락 캔들 보정 완료 (소요: {fill_elapsed:.2f}초)")

        for interval in ['5m', '30m', '1d']:
            start = time.time()
            logger.info(f"{interval} 업데이트 시작")
            await candle_collector.collect_batch_async(stocks, interval)
            elapsed = time.time() - start
            logger.info(f"{interval} 업데이트 완료 (소요: {elapsed:.2f}초)")

        candle_collector.close()

    asyncio.run(process_all_stocks())

    logger.info("캔들 업데이트 완료")

    if token_manager:
        token_manager.close()

    total_elapsed = time.time() - total_start
    logger.info(f"=== 장 마감 테스트 완료 (총 소요: {total_elapsed:.2f}초) ===")


# 5. 주봉 업데이트
def test_weekly_update():
    total_start = time.time()
    logger.info("=== 주봉 업데이트 테스트 시작 ===")

    tm = TokenManager.get_instance()
    stock_manager = StockManager(tm.redis_client)
    stocks = stock_manager.get_all_target_stocks()

    if not stocks:
        stocks = get_stocks(100)

    # 비동기 배치 처리로 변경
    async def update_all_weekly():
        candle_collector = CandleCollector(tm)
        logger.info(f"총 {len(stocks)}개 종목 주봉 업데이트")
        await candle_collector.collect_batch_async(stocks, '1w')
        candle_collector.close()

    asyncio.run(update_all_weekly())

    tm.close()
    total_elapsed = time.time() - total_start
    logger.info(f"=== 주봉 업데이트 테스트 완료 (소요: {total_elapsed:.2f}초) ===")



# 전체 흐름 테스트
def test_full_flow(collection_duration=60):
    logger.info("========================================")
    logger.info("       전체 흐름 테스트 시작")
    logger.info("========================================")
    
    test_check_and_initialize()
    
    test_update_financials()
    
    test_start_collection(duration_seconds=collection_duration)
    
    test_weekly_update()
    
    logger.info("========================================")
    logger.info("       전체 흐름 테스트 완료")
    logger.info("========================================")


if __name__ == "__main__":
    print("\n테스트 선택:")
    print("1. 초기화 테스트 (파싱 + 30m/1d/1w 수집)")
    print("2. 재무 데이터 테스트")
    print("3. 장 시작 테스트 (60초)")
    print("4. 장 마감 테스트 (누락 보정)")
    print("5. 주봉 업데이트 테스트")
    print("6. 전체 흐름 테스트 (1~5 순차)")
    
    choice = input("\n선택 (1-6): ").strip()
    
    if choice == "1":
        test_check_and_initialize()
    elif choice == "2":
        test_update_financials()
    elif choice == "3":
        test_start_collection(60)
    elif choice == "4":
        token_manager = TokenManager.get_instance()
        test_stop_collection()
    elif choice == "5":
        test_weekly_update()
    elif choice == "6":
        test_full_flow(60)
    else:
        print("잘못된 선택")
