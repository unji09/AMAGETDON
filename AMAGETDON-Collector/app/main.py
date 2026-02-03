import time
import pymysql
import threading
import asyncio
import aiohttp
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.parser import StockParser
from app.volume_tracker import VolumeTracker
from collector.websocket_collector import WebSocketCollector
from collector.candle_filler import CandleFiller
from collector.candle_collector import CandleCollector
from config.config import DB_CONFIG
from core.stock_manager import StockManager
from core.token_manager import TokenManager
from utils.logger import logger
from utils.market_hours import is_market_open
from utils.kis_api_client import KISApiClient
from collector.realtime_candle_builder import RealtimeCandleBuilder

token_manager = None
ws_collector = None
volume_tracker = None
candle_filler = None
rest_candle_builder = None
collection_active = False
rest_loop_task = None
candle_loop_task = None

#서버 시작 시 초기화(종목/업종 파싱, 30분봉/일봉/주봉 수집)
async def check_and_initialize(rate_limit: int = 18):
    start_time = time.time()
    logger.info("=== [START] 서버 초기화 시작 ===")

    try:
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()

        cursor.execute("SELECT stock_code FROM stock")
        rows = cursor.fetchall()
        stocks = [row[0] for row in rows]
        conn.close()

        if not stocks:
            logger.info("종목 데이터 없음 - 파싱 시작")
            parser = StockParser()
            await parser.parse_and_save()

            conn = pymysql.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute("SELECT stock_code FROM stock")
            stocks = [row[0] for row in cursor.fetchall()]
            conn.close()
            logger.info(f"종목 데이터 파싱 완료: {len(stocks)}개")
        else:
            logger.info(f"종목 데이터 이미 존재: {len(stocks)}개")

        if not stocks:
            logger.error("파싱된 종목이 없습니다.")
            return

        logger.info("과거 캔들 데이터 수집 시작")
        tm = TokenManager.get_instance()
        candle_collector = CandleCollector(tm)

        total_api_calls = 0
        for interval in ['30m', '1d', '1w']:
            logger.info(f"  - {interval} 수집 시작 ({len(stocks)}개 종목)...")

            result = await candle_collector.collect_batch_parallel(
                stock_codes=stocks,
                interval_type=interval,
                rate_limit=rate_limit
            )

            total_api_calls += result['api_calls']
            retries = result.get('total_retries', 0)
            logger.info(f"  - {interval} 완료: {result['success_count']}성공, {result['fail_count']}실패, "
                       f"{retries}재시도, {result['total_candles']}캔들, {result['elapsed_time']:.2f}초, "
                       f"{result['req_per_sec']:.1f} req/s")

        candle_collector.close()
        tm.close()

        total_elapsed = time.time() - start_time
        logger.info(f"=== [DONE] 서버 초기화 완료 (총 소요: {total_elapsed:.2f}초, 총 API: {total_api_calls}건, "
                   f"평균: {total_api_calls/total_elapsed:.1f} req/s) ===")

    except Exception as e:
        logger.error(f"초기화 체크 실패: {e}")
        import traceback
        traceback.print_exc()
        raise

#REST 수집(5초마다) + 새 유저 종목 분봉 보정 + 분봉 생성
async def run_rest_collection_loop():
    from utils.rate_limiter import HardRateLimiter, BatchRetryStats
    from utils.db import get_db_connection, save_stock_price
    from config.config import REDIS_KEYS

    global collection_active, token_manager, rest_candle_builder

    api_client = KISApiClient(token_manager)
    limiter = HardRateLimiter(18)
    rest_candle_builder = RealtimeCandleBuilder()

    connector = aiohttp.TCPConnector(limit=18)
    timeout = aiohttp.ClientTimeout(total=30)
    session = aiohttp.ClientSession(connector=connector, timeout=timeout)

    prev_user_stocks = set()

    async def fetch_price(stock_code):
        dto, retry_count = await api_client.fetch_price_direct(
            session, stock_code, limiter, return_retry_count=True
        )
        return stock_code, dto, retry_count

    logger.info("REST 수집 루프 시작")

    while collection_active:
        try:
            loop_start = time.time()

            top_stocks_key = REDIS_KEYS['top_10_stocks']
            user_stocks_key = REDIS_KEYS['user_stocks']

            top30 = set(token_manager.redis_client.lrange(top_stocks_key, 0, -1)) or set()
            user_keys = token_manager.redis_client.keys(f"{user_stocks_key}:*")
            user_stocks = {key.split(":")[-1] for key in user_keys} if user_keys else set()

            new_stocks = list(user_stocks - prev_user_stocks)
            if new_stocks:
                await fill_new_user_stocks(new_stocks, token_manager)
            prev_user_stocks = user_stocks.copy()

            rest_stocks = list(user_stocks - top30)

            if rest_stocks:
                batch_stats = BatchRetryStats()
                tasks = [fetch_price(code) for code in rest_stocks]
                results = await asyncio.gather(*tasks)

                now = datetime.now()
                for stock_code, dto, retry_count in results:
                    if dto:
                        try:
                            conn = get_db_connection(None)
                            save_stock_price(conn, dto)
                            conn.close()
                            batch_stats.record_success(retry_count)

                            # 분봉 생성을 위해 틱 데이터 추가
                            rest_candle_builder.on_tick(stock_code, {
                                'time': now,
                                'price': dto.current_price,
                                'volume': dto.volume
                            })
                        except Exception as e:
                            logger.error(f"REST DB 저장 실패 ({stock_code}): {e}")
                            batch_stats.record_fail()
                    else:
                        batch_stats.record_fail()

                batch_stats.log_summary("REST 수집")

            elapsed = time.time() - loop_start
            if elapsed < 5:
                await asyncio.sleep(5 - elapsed)

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"REST 수집 루프 오류: {e}")
            await asyncio.sleep(5)

    # 종료 시 남은 틱 데이터로 캔들 생성
    if rest_candle_builder:
        rest_candle_builder.close()
    await session.close()
    await api_client.close()
    logger.info("REST 수집 루프 종료")


# 거래량 순위 조회(5분마다) + 새로 추가된 웹소켓 종목만 누락 보정
async def run_volume_rank_loop():
    global collection_active, token_manager, ws_collector, volume_tracker

    prev_top_stocks = set()

    while collection_active:
        try:
            loop_start = time.time()

            top_stocks = await volume_tracker.get_top_volume_stocks()

            if top_stocks and ws_collector and ws_collector.ws:
                ws_collector.subscribe_stocks(top_stocks)
                logger.info(f"거래량 TOP 구독 갱신: {len(top_stocks)}개")

                # 새로 추가된 웹소켓 종목만 누락 보정
                top_stocks_set = set(top_stocks)
                new_ws_stocks = list(top_stocks_set - prev_top_stocks)
                if new_ws_stocks:
                    await fill_ws_missing_candles(new_ws_stocks, token_manager)
                prev_top_stocks = top_stocks_set

            elapsed = time.time() - loop_start
            wait_time = 300 - elapsed
            if wait_time > 0:
                await asyncio.sleep(wait_time)

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"거래량 순위 루프 오류: {e}")
            await asyncio.sleep(60)


# 웹소켓 종목 누락 분봉 보정 (오늘 데이터만)
async def fill_ws_missing_candles(stock_codes: list, token_manager):
    if not stock_codes:
        return

    try:
        today = datetime.now().date()
        result = await CandleFiller.fill_missing_candles_parallel(
            token_manager=token_manager,
            stock_codes=stock_codes,
            rate_limit=18,
            fill_1m=True,
            fill_5m=True,
            fill_30m=True,
            batch_size=50,
            target_date=today
        )

        if result['success_count'] > 0:
            logger.info(f"WS 종목 누락 보정: {result['success_count']}성공, {result['fail_count']}실패")
    except Exception as e:
        logger.error(f"WS 종목 누락 보정 오류: {e}")


# 새 종목 분봉 보정 (병렬 처리)
async def fill_new_user_stocks(new_stocks: list, token_manager):
    if not new_stocks:
        return

    logger.info(f"새 종목 분봉 보정 시작: {len(new_stocks)}개")

    result = await CandleFiller.fill_missing_candles_parallel(
        token_manager=token_manager,
        stock_codes=new_stocks,
        rate_limit=18,
        fill_1m=True,
        fill_5m=True,
        fill_30m=True,
        batch_size=50
    )

    logger.info(f"새 종목 분봉 보정 완료: {result['success_count']}성공, {result['fail_count']}실패, {result['elapsed_time']:.1f}초")


#주식 시장 시작 호출(websocket/rest 수집 시작)
async def start_collection():
    global token_manager, ws_collector, volume_tracker
    global collection_active, rest_loop_task, candle_loop_task

    if collection_active:
        logger.warning("이미 수집 중")
        return

    logger.info("장 시작")

    token_manager = TokenManager.get_instance()
    volume_tracker = VolumeTracker(token_manager)
    ws_collector = WebSocketCollector(token_manager)

    ws_collector.connect()
    top_10_stocks = await volume_tracker.get_top_volume_stocks()
    if top_10_stocks:
        ws_collector.subscribe_stocks(top_10_stocks)
        logger.info(f"초기 구독 완료: {len(top_10_stocks)}개 종목")

    collection_active = True

    rest_loop_task = asyncio.create_task(run_rest_collection_loop())

    candle_loop_task = asyncio.create_task(run_volume_rank_loop())

#주식 시장 마감 호출(전체 종목 누락 업데이트)
async def stop_collection(rate_limit: int = 18):
    global collection_active, ws_collector, token_manager, volume_tracker
    global rest_loop_task, candle_loop_task

    if not collection_active:
        logger.warning("수집 실행 중 아님")
        return

    start_time = time.time()
    logger.info("=== [START] 장 마감 ===")

    collection_active = False

    if rest_loop_task:
        rest_loop_task.cancel()
        try:
            await rest_loop_task
        except asyncio.CancelledError:
            pass

    if candle_loop_task:
        candle_loop_task.cancel()
        try:
            await candle_loop_task
        except asyncio.CancelledError:
            pass

    await asyncio.sleep(1)

    if volume_tracker:
        await volume_tracker.close()

    logger.info("장 마감 후 데이터 업데이트 시작")

    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute("SELECT stock_code FROM stock")
    stocks = [row[0] for row in cursor.fetchall()]
    conn.close()

    if not stocks:
        logger.warning("대상 종목 없음")
        return

    logger.info(f"전체 종목: {len(stocks)}개")

    target_date = datetime.now().date()

    fill_result = await CandleFiller.fill_missing_candles_parallel(
        token_manager=token_manager,
        stock_codes=stocks,
        rate_limit=18,
        fill_1m=True,
        fill_5m=True,
        fill_30m=True,
        batch_size=100,
        target_date=target_date
    )
    logger.info(f"누락 보정: {fill_result['success_count']}성공, {fill_result['fail_count']}실패, {fill_result['elapsed_time']:.1f}초")

    candle_collector = CandleCollector(token_manager)
    result = await candle_collector.collect_batch_parallel(
        stock_codes=stocks,
        interval_type='1d',
        rate_limit=18,
        batch_size=100,
        days=1  # 장 마감 시 오늘 하루치만
    )
    retries = result.get('total_retries', 0)
    logger.info(f"일봉 수집: {result['success_count']}성공, {result['fail_count']}실패, {retries}재시도, {result['elapsed_time']:.1f}초")
    candle_collector.close()

    total_elapsed = time.time() - start_time
    logger.info(f"장 마감 처리 완료: {total_elapsed:.1f}초")

    if token_manager:
        token_manager.close()

#주봉 업데이트
async def weekly_update():
    start_time = time.time()
    logger.info("주봉 업데이트 시작")

    tm = TokenManager.get_instance()

    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute("SELECT stock_code FROM stock")
    stocks = [row[0] for row in cursor.fetchall()]
    conn.close()

    if not stocks:
        logger.warning("대상 종목 없음")
        tm.close()
        return

    logger.info(f"전체 종목: {len(stocks)}개")

    candle_collector = CandleCollector(tm)
    result = await candle_collector.collect_batch_parallel(
        stock_codes=stocks,
        interval_type='1w',
        rate_limit=18,
        batch_size=100,
        days=7  # 주봉 업데이트 시 이번 주 하나만
    )
    candle_collector.close()
    tm.close()

    elapsed = time.time() - start_time
    retries = result.get('total_retries', 0)
    logger.info(f"주봉 업데이트 완료: {result['success_count']}성공, {result['fail_count']}실패, {retries}재시도, {elapsed:.1f}초")

#재무 데이터 업데이트
async def update_financials(rate_limit: int = 18, batch_size: int = 100):
    from utils.rate_limiter import HardRateLimiter, BatchRetryStats

    start_time = time.time()
    logger.info("재무 데이터 업데이트 시작")

    try:
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()

        today = datetime.now().date()
        cursor.execute("SELECT COUNT(*) FROM stock WHERE DATE(updated_at) = %s AND per IS NOT NULL", (today,))

        if cursor.fetchone()[0] > 0:
            logger.info("오늘 이미 재무 데이터 업데이트됨 - 스킵")
            conn.close()
            return

        cursor.execute("SELECT stock_code FROM stock")
        stocks = [row[0] for row in cursor.fetchall()]
        conn.close()

        total_batches = (len(stocks) + batch_size - 1) // batch_size

        tm = TokenManager.get_instance()
        api_client = KISApiClient(tm)

        limiter = HardRateLimiter(rate_limit)

        success_count = 0
        fail_count = 0

        async def fetch_financial(session, stock_code):
            data, retry_count = await api_client.fetch_financial_direct(
                session, stock_code, limiter, return_retry_count=True
            )
            return stock_code, data, retry_count

        try:
            connector = aiohttp.TCPConnector(limit=18)
            timeout = aiohttp.ClientTimeout(total=600)
            session = aiohttp.ClientSession(connector=connector, timeout=timeout)

            for batch_idx in range(total_batches):
                batch_stats = BatchRetryStats()
                batch_start = batch_idx * batch_size
                batch_end = min(batch_start + batch_size, len(stocks))
                batch_codes = stocks[batch_start:batch_end]

                tasks = [fetch_financial(session, code) for code in batch_codes]
                batch_results = await asyncio.gather(*tasks)

                db_conn = pymysql.connect(**DB_CONFIG)
                db_cursor = db_conn.cursor()

                for stock_code, data, retry_count in batch_results:
                    if data:
                        db_cursor.execute("""
                            UPDATE stock
                            SET per=%s, pbr=%s, eps=%s, bps=%s, market_cap=%s, updated_at=NOW()
                            WHERE stock_code=%s
                        """, (data['per'], data['pbr'], data['eps'], data['bps'], data['market_cap'], stock_code))
                        batch_stats.record_success(retry_count)
                    else:
                        batch_stats.record_fail()

                db_conn.commit()
                db_conn.close()

                success_count += batch_stats.success_count
                fail_count += batch_stats.fail_count

                batch_stats.log_summary(f"재무 배치 {batch_idx + 1}/{total_batches}")

        except Exception as e:
            logger.error(f"에러 발생: {e}")
        finally:
            await session.close()
            await api_client.close()
            tm.close()

        elapsed = time.time() - start_time
        logger.info(f"재무 데이터 업데이트 완료: {success_count}성공, {fail_count}실패, {elapsed:.1f}초")

    except Exception as e:
        logger.error(f"재무 데이터 업데이트 실패: {e}")
        import traceback
        traceback.print_exc()

async def main():
    logger.info("실시간 시세 수집 스케줄러 시작")

    await check_and_initialize()

    now = datetime.now()
    if now.hour > 8 or (now.hour == 8 and now.minute >= 40):
        logger.info("8시 40분 이후 - 즉시 재무 데이터 업데이트")
        await update_financials()

    scheduler = AsyncIOScheduler(timezone='Asia/Seoul')

    scheduler.add_job(
        update_financials,
        CronTrigger(day_of_week='mon-fri', hour=8, minute=40),
        id='update_financials'
    )

    scheduler.add_job(
        start_collection,
        CronTrigger(day_of_week='mon-fri', hour=9, minute=0),
        id='start_collection'
    )

    scheduler.add_job(
        stop_collection,
        CronTrigger(day_of_week='mon-fri', hour=15, minute=30),
        id='stop_collection'
    )

    scheduler.add_job(
        weekly_update,
        CronTrigger(day_of_week='sat', hour=9, minute=0),
        id='weekly_update'
    )

    scheduler.start()
    logger.info("스케줄 등록 완료")
    logger.info("- 평일 08:40: 재무 데이터 업데이트")
    logger.info("- 평일 09:00: 장 시작")
    logger.info("- 평일 15:30: 장 마감 + 캔들 업데이트 (5m, 30m, 1d)")
    logger.info("- 토요일 09:00: 주봉 업데이트 (1w)")

    if is_market_open():
        logger.info("현재 장중 - 즉시 수집 시작")
        await start_collection()

    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())
