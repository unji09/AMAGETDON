import time
import pymysql
import threading
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
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

#서버 시작 시 초기화(종목 파싱, 30분봉/일봉/주봉 수집)
def check_and_initialize():
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
        
        token_manager = TokenManager.get_instance()
        candle_collector = CandleCollector(token_manager)
        
        for stock_code in stocks:
            try:
                candle_collector.collect_or_update(stock_code, '30m')
                candle_collector.collect_or_update(stock_code, '1d')
                candle_collector.collect_or_update(stock_code, '1w')
            except Exception as e:
                logger.error(f"{stock_code} 초기 캔들 수집 실패: {e}")
        
        candle_collector.close()
        token_manager.close()
        logger.info("과거 캔들 데이터 체크 완료")
            
    except Exception as e:
        logger.error(f"초기화 체크 실패: {e}")
        raise

#websocket 수집(5분마다 거래량 top 구독 갱신)
def run_websocket_collector():
    global collection_active, ws_collector, volume_tracker
    
    while collection_active:
        if not ws_collector.ws:
            ws_collector.connect()

        top_30_stocks = volume_tracker.get_top_30_volume_stocks()
        
        if top_30_stocks:
            if ws_collector.ws:
                ws_collector.subscribe_stocks(top_30_stocks)
        
        time.sleep(300)

#rest 수집
def run_rest_collector():
    global collection_active, rest_collector
    rest_collector.collect()

#주식 시장 시작 호출(websocket/rest 수집 시작)
def start_collection():
    global token_manager, ws_collector, rest_collector, volume_tracker
    global ws_thread, rest_thread, collection_active, candle_filler
    
    if collection_active:
        logger.warning("이미 수집 중")
        return
    
    logger.info("장 시작")
    
    token_manager = TokenManager.get_instance()
    volume_tracker = VolumeTracker(token_manager)
    ws_collector = WebSocketCollector(token_manager)
    rest_collector = RealtimeCollector(token_manager)
    
    ws_collector.connect()
    top_30_stocks = volume_tracker.get_top_30_volume_stocks()
    if top_30_stocks:
        ws_collector.subscribe_stocks(top_30_stocks)
        logger.info(f"초기 구독 완료: {len(top_30_stocks)}개 종목")
    
    collection_active = True
    
    ws_thread = threading.Thread(target=run_websocket_collector)
    ws_thread.daemon = True
    ws_thread.start()
    
    rest_thread = threading.Thread(target=run_rest_collector)
    rest_thread.daemon = True
    rest_thread.start()

#주식 시장 마감 호출(전체 종목 누락 업데이트)
def stop_collection():
    global collection_active, ws_collector, rest_collector, token_manager
    
    if not collection_active:
        logger.warning("수집 실행 중 아님")
        return
    
    logger.info("장 마감")
    
    collection_active = False
    time.sleep(1)
    
    if ws_collector:
        ws_collector.close()
    if rest_collector:
        rest_collector.close()

    global candle_filler
    if candle_filler:
        candle_filler.stop()

    logger.info("장 마감 후 데이터 업데이트 시작")
    stock_manager = StockManager(token_manager.redis_client)
    candle_collector = CandleCollector(token_manager)

    filler = CandleFiller(token_manager)

    stocks = stock_manager.get_all_target_stocks()
    
    for stock_code in stocks:
        try:
            filler.fill_missing_candles(
                stock_code=stock_code,
                fill_1m=True,
                fill_5m=True,
                fill_30m=True
            )

            candle_collector.collect_or_update(stock_code, '5m')
            candle_collector.collect_or_update(stock_code, '30m')
            candle_collector.collect_or_update(stock_code, '1d')
        except Exception as e:
            logger.error(f"{stock_code} 캔들 업데이트 실패: {e}")
    
    filler.close()
    candle_collector.close()
    logger.info("캔들 업데이트 완료")
    
    if token_manager:
        token_manager.close()

#주봉 업데이트
def weekly_update():
    logger.info("주봉 업데이트 시작")
    
    token_manager = TokenManager.get_instance()
    stock_manager = StockManager(token_manager.redis_client)
    candle_collector = CandleCollector(token_manager)
    
    stocks = stock_manager.get_all_target_stocks()
    
    for stock_code in stocks:
        try:
            candle_collector.collect_or_update(stock_code, '1w')
        except Exception as e:
            logger.error(f"{stock_code} 주봉 업데이트 실패: {e}")
    
    candle_collector.close()
    token_manager.close()
    logger.info("주봉 업데이트 완료")

#재무 데이터 업데이트
def update_financials():
    logger.info("재무 데이터 업데이트 시작")
    
    try:
        token_manager = TokenManager.get_instance()
        api_client = KISApiClient(token_manager)
        
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        today = datetime.now().date()
        cursor.execute("SELECT COUNT(*) FROM stock WHERE DATE(updated_at) = %s AND per IS NOT NULL", (today,))
        
        if cursor.fetchone()[0] > 0:
            logger.info("오늘 이미 재무 데이터 업데이트됨 - 스킵")
            conn.close()
            token_manager.close()
            return
        
        cursor.execute("SELECT stock_code FROM stock")
        stocks = [row[0] for row in cursor.fetchall()]
        
        logger.info(f"총 {len(stocks)}개 종목 재무 데이터 수집 시작")
        
        success = 0
        fail = 0
        
        for i, stock_code in enumerate(stocks, 1):
            try:
                info = api_client.fetch_stock_price_info(stock_code)
                
                if info:
                    cursor.execute("""
                        UPDATE stock 
                        SET per=%s, pbr=%s, eps=%s, bps=%s, market_cap=%s, updated_at=NOW()
                        WHERE stock_code=%s
                    """, (info['per'], info['pbr'], info['eps'], info['bps'], info['market_cap'], stock_code))
                    success += 1
                else:
                    fail += 1
                
                if i % 100 == 0:
                    conn.commit()
                    logger.info(f"진행: {i}/{len(stocks)} (성공: {success}, 실패: {fail})")
                
                time.sleep(0.05)
                
            except Exception as e:
                fail += 1
                logger.error(f"{stock_code} 실패: {e}")
        
        conn.commit()
        conn.close()
        token_manager.close()
        
        logger.info(f"재무 데이터 업데이트 완료 - 성공: {success}, 실패: {fail}")
        
    except Exception as e:
        logger.error(f"재무 데이터 업데이트 실패: {e}")

def main():
    logger.info("실시간 시세 수집 스케줄러 시작")
    
    check_and_initialize()

    now = datetime.now()
    if now.hour > 8 or (now.hour == 8 and now.minute >= 50):
        logger.info("8시 50분 이후 - 즉시 재무 데이터 업데이트")
        update_financials()
    
    scheduler = BackgroundScheduler(timezone='Asia/Seoul')
    
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
    logger.info("- 평일 09:00: 장 시작")
    logger.info("- 평일 15:30: 장 마감 + 캔들 업데이트 (5m, 30m, 1d)")
    logger.info("- 토요일 09:00: 주봉 업데이트 (1w)")
    
    if is_market_open():
        logger.info("현재 장중 - 즉시 수집 시작")
        start_collection()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("종료")
        stop_collection()
        scheduler.shutdown()

if __name__ == "__main__":
    main()