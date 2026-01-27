import logging
import schedule
import time
import pymysql
from config import DB_CONFIG, COLLECTION_CONFIG
from parser import StockParser
from collector import RealtimeCollector

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def check_and_initialize():
    try:
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM stock")
        count = cursor.fetchone()[0]
        
        conn.close()
        
        if count == 0:
            logging.info("종목 데이터 없음")
            
            parser = StockParser()
            parser.parse_and_save()
            
            logging.info("종목 데이터 로딩 완료")
        else:
            logging.info(f"종목 데이터 이미 존재 ({count}개)")
            
    except Exception as e:
        logging.error(f"초기화 체크 실패: {e}")
        raise

def main():
    check_and_initialize()
    
    collector = RealtimeCollector() 
    
    schedule.every(5).seconds.do(collector.collect) 
    
    while True: 
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    main()