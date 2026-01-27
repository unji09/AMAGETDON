import time
import threading
from core.logger import logger
from core.token_manager import TokenManager
from app.parser import StockParser
from app.volume_tracker import VolumeTracker
from app.websocket_collector import WebSocketCollector
from app.collector import RealtimeCollector
from config.config import DB_CONFIG
import pymysql
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

token_manager = None
ws_collector = None
rest_collector = None
volume_tracker = None
ws_thread = None
rest_thread = None
collection_active = False

def check_and_initialize():
    try:
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM stock")
        count = cursor.fetchone()[0]
        
        conn.close()
        
        if count == 0:
            logger.info("종목 데이터 없음")
            
            parser = StockParser()
            parser.parse_and_save()
            
            logger.info("종목 데이터 로딩 완료")
        else:
            logger.info(f"종목 데이터 이미 존재 ({count}개)")
            
    except Exception as e:
        logger.error(f"초기화 체크 실패: {e}")
        raise

def run_websocket_collector():
    global collection_active, ws_collector, volume_tracker
    
    if not ws_collector.connect():
        logger.error("WebSocket 연결 실패")
        return
    
    time.sleep(2)
    
    while collection_active:
        top_30_stocks = volume_tracker.get_top_30_volume_stocks()
        
        if top_30_stocks:
            logger.info(f"TOP 30 종목: {len(top_30_stocks)}개")
            ws_collector.subscribe_stocks(top_30_stocks)
        else:
            logger.warning("TOP 30 조회 실패")
        
        time.sleep(300)

def run_rest_collector():
    global collection_active, rest_collector
    rest_collector.collect()

def start_collection():
    global token_manager, ws_collector, rest_collector, volume_tracker
    global ws_thread, rest_thread, collection_active
    
    if collection_active:
        logger.warning("이미 수집 중")
        return
    
    logger.info("장 시작 - 수집 시작")
    
    token_manager = TokenManager(
        redis_host='host.docker.internal',
        redis_port=6379
    )
    
    volume_tracker = VolumeTracker(token_manager)
    ws_collector = WebSocketCollector(token_manager)
    rest_collector = RealtimeCollector(token_manager)
    
    collection_active = True
    
    ws_thread = threading.Thread(target=run_websocket_collector)
    ws_thread.daemon = True
    ws_thread.start()
    
    rest_thread = threading.Thread(target=run_rest_collector)
    rest_thread.daemon = True
    rest_thread.start()

def stop_collection():
    global collection_active, ws_collector, rest_collector, token_manager
    
    if not collection_active:
        logger.warning("수집 실행 중이 아님")
        return
    
    logger.info("장 마감 - 수집 종료")
    
    collection_active = False
    time.sleep(1)
    
    if ws_collector:
        ws_collector.close()
    if rest_collector:
        rest_collector.close()
    if token_manager:
        token_manager.close()

def main():
    logger.info("=== 실시간 시세 수집 스케줄러 시작 ===")
    
    check_and_initialize()
    
    scheduler = BackgroundScheduler(timezone='Asia/Seoul')
    
    scheduler.add_job(
        start_collection,
        CronTrigger(
            day_of_week='mon-fri',
            hour=9,
            minute=0
        )
    )
    
    scheduler.add_job(
        stop_collection,
        CronTrigger(
            day_of_week='mon-fri',
            hour=15,
            minute=30
        )
    )
    
    scheduler.start()
    logger.info("스케줄 등록 완료: 평일 09:00~15:30")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("프로그램 종료")
        stop_collection()
        scheduler.shutdown()

if __name__ == "__main__":
    main()