import time
import pymysql
import threading
import asyncio
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.parser import StockParser
from app.volume_tracker import VolumeTracker
from collector.websocket_collector import WebSocketCollector
from collector.realtime_collector import RealtimeCollector
from collector.candle_filler import CandleFiller
from collector.candle_collector import CandleCollector
from config.config import DB_CONFIG
from core.stock_manager import StockManager
from core.token_manager import TokenManager
from utils.logger import logger
from utils.market_hours import is_market_open
from utils.kis_api_client import KISApiClient

token_manager = None
ws_collector = None
rest_collector = None
volume_tracker = None
candle_filler = None
collection_active = False
volume_loop_task = None

#서버 시작 시 초기화(종목 파싱, 30분봉/일봉/주봉 수집)
async def check_and_initialize():
    try:
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()

        cursor.execute("SELECT stock_code FROM stock")
        rows = cursor.fetchall()
        stocks = [row[0] for row in rows]

        if not stocks:
            logger.info("종목 데이터 없음")
            parser = StockParser()
            parser.parse_and_save()

            cursor.execute("SELECT stock_code FROM stock")
            stocks = [row[0] for row in cursor.fetchall()]
            logger.info("종목 데이터 로딩 완료")
        else:
            logger.info(f"종목 데이터 이미 존재")

        conn.close()

        logger.info("과거 캔들 데이터 체크 시작")

        tm = TokenManager.get_instance()
        candle_collector = CandleCollector(tm)

        for interval in ['30m', '1d', '1w']:
            logger.info(f"{interval} 수집 시작")
            await candle_collector.collect_batch_async(stocks, interval)
            logger.info(f"{interval} 수집 완료")

        candle_collector.close()
        tm.close()

        logger.info("과거 캔들 데이터 체크 완료")

    except Exception as e:
        logger.error(f"초기화 체크 실패: {e}")
        raise

#websocket 수집(5분마다 거래량 top 구독 갱신) - 비동기 루프
async def run_volume_update_loop():
    global collection_active, ws_collector, volume_tracker

    while collection_active:
        try:
            if not ws_collector.ws:
                ws_collector.connect()

            top_10_stocks = await volume_tracker.get_top_volume_stocks()

            if top_10_stocks:
                if ws_collector.ws:
                    ws_collector.subscribe_stocks(top_10_stocks)

            await asyncio.sleep(300)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"거래량 업데이트 루프 오류: {e}")
            await asyncio.sleep(60)

#rest 수집 (별도 스레드에서 실행)
def run_rest_collector():
    global collection_active, rest_collector
    rest_collector.collect()

#주식 시장 시작 호출(websocket/rest 수집 시작)
async def start_collection():
    global token_manager, ws_collector, rest_collector, volume_tracker
    global collection_active, candle_filler, volume_loop_task

    if collection_active:
        logger.warning("이미 수집 중")
        return

    logger.info("장 시작")

    token_manager = TokenManager.get_instance()
    volume_tracker = VolumeTracker(token_manager)
    ws_collector = WebSocketCollector(token_manager)
    stock_manager = StockManager(token_manager.redis_client)
    rest_collector = RealtimeCollector(token_manager, stock_manager)

    ws_collector.connect()
    top_10_stocks = await volume_tracker.get_top_volume_stocks()
    if top_10_stocks:
        ws_collector.subscribe_stocks(top_10_stocks)
        logger.info(f"초기 구독 완료: {len(top_10_stocks)}개 종목")

    collection_active = True

    # 비동기 거래량 업데이트 루프 시작
    volume_loop_task = asyncio.create_task(run_volume_update_loop())

    # REST 수집은 별도 스레드에서 실행 (동기 코드)
    rest_thread = threading.Thread(target=run_rest_collector)
    rest_thread.daemon = True
    rest_thread.start()

#주식 시장 마감 호출(전체 종목 누락 업데이트)
async def stop_collection():
    global collection_active, ws_collector, rest_collector, token_manager, volume_tracker
    global candle_filler, volume_loop_task

    if not collection_active:
        logger.warning("수집 실행 중 아님")
        return

    logger.info("장 마감")

    collection_active = False

    # 비동기 루프 태스크 취소
    if volume_loop_task:
        volume_loop_task.cancel()
        try:
            await volume_loop_task
        except asyncio.CancelledError:
            pass

    await asyncio.sleep(1)

    if rest_collector:
        rest_collector.close()

    # VolumeTracker 세션 정리
    if volume_tracker:
        await volume_tracker.close()

    if candle_filler:
        candle_filler.stop()

    logger.info("장 마감 후 데이터 업데이트 시작")
    stock_manager = StockManager(token_manager.redis_client)
    stocks = stock_manager.get_all_target_stocks()

    candle_collector = CandleCollector(token_manager)

    # 누락 캔들 보정
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
    logger.info("누락 캔들 보정 완료")

    # 캔들 수집은 배치로 처리
    for interval in ['5m', '30m', '1d']:
        logger.info(f"{interval} 업데이트 시작")
        await candle_collector.collect_batch_async(stocks, interval)
        logger.info(f"{interval} 업데이트 완료")

    candle_collector.close()

    logger.info("캔들 업데이트 완료")

    if token_manager:
        token_manager.close()

#주봉 업데이트
async def weekly_update():
    logger.info("주봉 업데이트 시작")

    tm = TokenManager.get_instance()
    stock_manager = StockManager(tm.redis_client)
    stocks = stock_manager.get_all_target_stocks()

    candle_collector = CandleCollector(tm)
    logger.info(f"총 {len(stocks)}개 종목 주봉 업데이트")
    await candle_collector.collect_batch_async(stocks, '1w')
    candle_collector.close()

    tm.close()
    logger.info("주봉 업데이트 완료")

async def update_financials():
    logger.info("재무 데이터 업데이트 시작")

    try:
        tm = TokenManager.get_instance()
        api_client = KISApiClient(tm)

        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()

        today = datetime.now().date()
        cursor.execute("SELECT COUNT(*) FROM stock WHERE DATE(updated_at) = %s AND per IS NOT NULL", (today,))

        if cursor.fetchone()[0] > 0:
            logger.info("오늘 이미 재무 데이터 업데이트됨 - 스킵")
            conn.close()
            tm.close()
            return

        cursor.execute("SELECT stock_code FROM stock")
        stocks = [row[0] for row in cursor.fetchall()]

        logger.info(f"총 {len(stocks)}개 종목 재무 데이터 수집 시작")

        success = 0
        fail = 0
        batch_size = 100

        try:
            for i in range(0, len(stocks), batch_size):
                batch = stocks[i:i + batch_size]

                try:
                    results = await api_client.fetch_prices_batch(batch)

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
        finally:
            await api_client.close()

        conn.commit()
        conn.close()
        tm.close()

        logger.info(f"재무 데이터 업데이트 완료 - 성공: {success}, 실패: {fail}")

    except Exception as e:
        logger.error(f"재무 데이터 업데이트 실패: {e}")

async def main():
    logger.info("실시간 시세 수집 스케줄러 시작")

    await check_and_initialize()

    now = datetime.now()
    if now.hour > 8 or (now.hour == 8 and now.minute >= 40):
        logger.info("8시 40분 이후 - 즉시 재무 데이터 업데이트")
        await update_financials()

    # AsyncIOScheduler 사용 (이벤트 루프와 통합)
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

    try:
        # 비동기 대기 루프
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("종료")
        await stop_collection()
        scheduler.shutdown()

if __name__ == "__main__":
    asyncio.run(main())