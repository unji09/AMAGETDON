import pymysql
import csv
import time
import asyncio 
from config.config import DB_CONFIG
from utils.logger import logger
from utils.kis_api_client import KISApiClient
from core.token_manager import TokenManager

class StockParser:
    
    def __init__(self):
        self.conn = None
    
    def connect_db(self):
        if self.conn is None or not self.conn.open:
            self.conn = pymysql.connect(**DB_CONFIG)
    
    #업종 파일 파싱
    def parse_sector_csv(self):
        logger.info("업종 데이터 파싱 시작")
        self.connect_db()
        cursor = self.conn.cursor()
        
        try:
            cursor.execute("SELECT COUNT(*) FROM sector")
            existing_count = cursor.fetchone()[0]
            
            if existing_count > 0:
                logger.info(f"업종 데이터 이미 존재: {existing_count}개 - 스킵")
                return

            with open('./data/sector_large_mapping.csv', 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    sql = """
                        INSERT INTO sector (sector_code, sector_name, sector_level, parent_code, created_at)
                        VALUES (%s, %s, 'LARGE', NULL, NOW())
                    """
                    cursor.execute(sql, (row['code'], row['name']))
            
            logger.info("대분류 파싱 완료")
            
            with open('./data/sector_medium_mapping.csv', 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    sql = """
                        INSERT INTO sector (sector_code, sector_name, sector_level, parent_code, created_at)
                        VALUES (%s, %s, 'MEDIUM', %s, NOW())
                    """
                    cursor.execute(sql, (row['code'], row['name'], row['parent_code']))
            
            logger.info("중분류 파싱 완료")
            
            with open('./data/sector_small_mapping.csv', 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    sql = """
                        INSERT INTO sector (sector_code, sector_name, sector_level, parent_code, created_at)
                        VALUES (%s, %s, 'SMALL', %s, NOW())
                    """
                    cursor.execute(sql, (row['code'], row['name'], row['parent_code']))
            
            logger.info("소분류 파싱 완료")
            
            self.conn.commit()
            
            cursor.execute("SELECT COUNT(*) FROM sector WHERE sector_level = 'LARGE'")
            large_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM sector WHERE sector_level = 'MEDIUM'")
            medium_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM sector WHERE sector_level = 'SMALL'")
            small_count = cursor.fetchone()[0]
            
            logger.info(f"업종 데이터 저장 완료 - 대분류: {large_count}개, 중분류: {medium_count}개, 소분류: {small_count}개")
            
        except Exception as e:
            self.conn.rollback()
            logger.error(f"업종 데이터 파싱 실패: {e}")
            raise

    #.mst 파일 파싱
    def parse_mst_file(self, filepath, market_type):
        stocks = []
        
        try:
            part2_length = 228 if market_type == 'KOSPI' else 222
            
            with open(filepath, 'r', encoding='cp949') as f:
                for row in f:
                    if len(row.strip()) == 0:
                        continue
                    
                    rf1 = row[0:len(row) - part2_length]
                    stock_code = rf1[0:9].strip()
                    stock_name = rf1[21:].strip()
                
                    rf2 = row[-part2_length:]
                    group_code = rf2[0:2].strip()
                    
                    if group_code != 'ST':
                        continue
                    
                    stocks.append({
                        'code': stock_code,
                        'name': stock_name,
                        'market': market_type,
                        'sector_code': '000000'
                    })

            logger.info(f"{market_type} 파싱 완료: {len(stocks)}개")
            return stocks
            
        except Exception as e:
            logger.error(f"{filepath} 파싱 실패: {e}")
            return []
    
    def save_to_db(self, stocks):
        self.connect_db()
        cursor = self.conn.cursor()
        
        try:
            cursor.execute("SELECT COUNT(*) FROM stock")
            existing_count = cursor.fetchone()[0]
            
            if existing_count > 0:
                logger.info(f"종목 데이터 이미 존재: {existing_count}개 - 스킵")
                return
            
            sql = """
                INSERT INTO stock (stock_code, stock_name, market_type, sector_code, created_at, updated_at)
                VALUES (%s, %s, %s, %s, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                    stock_name = VALUES(stock_name),
                    updated_at = NOW()
            """
            
            success = 0
            
            for stock in stocks:
                try:
                    cursor.execute(sql, (
                        stock['code'],
                        stock['name'],
                        stock['market'],
                        stock['sector_code']
                    ))
                    success += 1
                except Exception as e:
                    logger.error(f"저장 실패 {stock['code']}: {e}")
            
            self.conn.commit()
            logger.info(f"DB 저장 완료: {success}개")
            
        except Exception as e:
            self.conn.rollback()
            logger.error(f"종목 데이터 저장 실패: {e}")
            raise
    
    #업종 코드 수집
    def fetch_and_update_sector_codes(self):
        self.connect_db()
        cursor = self.conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM stock WHERE sector_code != '000000'")
        updated_count = cursor.fetchone()[0]
        
        if updated_count > 0:
            logger.info(f"업종 코드 이미 업데이트됨: {updated_count}개 - 스킵")
            return
        
        cursor.execute("SELECT stock_code FROM stock WHERE sector_code = '000000'")
        stock_codes = [row[0] for row in cursor.fetchall()]
        
        logger.info(f"총 {len(stock_codes)}개 종목 업종 코드 수집 시작 (병렬 처리)")
        
        token_manager = TokenManager.get_instance()
        api_client = KISApiClient(token_manager)
        
        success_count = 0
        fail_count = 0
        valid_sector_codes = set()
        
        cursor.execute("SELECT sector_code FROM sector WHERE sector_level = 'SMALL'")
        db_sector_codes = set(row[0] for row in cursor.fetchall())
        
        logger.info(f"DB 소분류 업종 코드: {len(db_sector_codes)}개")
        
        # 배치 처리 (100개씩)
        batch_size = 100
        for i in range(0, len(stock_codes), batch_size):
            batch = stock_codes[i:i + batch_size]
            
            # 비동기 배치 호출
            results = asyncio.run(api_client.fetch_stock_basic_info_batch(batch))
            
            for stock_code, stock_info in results.items():
                if stock_info:
                    sector_value = stock_info.get('sector_small_code')
                    
                    if not sector_value:
                        fail_count += 1
                        continue
                    
                    if sector_value in db_sector_codes:
                        sql = """
                            UPDATE stock 
                            SET sector_code = %s, updated_at = NOW()
                            WHERE stock_code = %s
                        """
                        cursor.execute(sql, (sector_value, stock_code))
                        success_count += 1
                        valid_sector_codes.add(sector_value)
                    else:
                        fail_count += 1
                        logger.debug(f"{stock_code}: 업종 '{sector_value}' DB에 없음")
            
            # 배치에서 실패한 종목 카운트
            fail_count += len(batch) - len(results)
            
            self.conn.commit()
            logger.info(f"진행: {min(i + batch_size, len(stock_codes))}/{len(stock_codes)} (성공: {success_count}, 실패: {fail_count})")
        
        self.conn.commit()
        
        logger.info(f"업종 코드 수집 완료 - 성공: {success_count}, 실패: {fail_count}")
        logger.info(f"발견된 유효 업종 코드: {len(valid_sector_codes)}개")
        
        token_manager.close()

    def parse_and_save(self):
        logger.info("파싱 시작")

        self.parse_sector_csv()
        
        logger.info("종목 파싱 시작")

        kospi_stocks = self.parse_mst_file('./data/kospi_code.mst', 'KOSPI')
        kosdaq_stocks = self.parse_mst_file('./data/kosdaq_code.mst', 'KOSDAQ')
        
        all_stocks = kospi_stocks + kosdaq_stocks
        
        if len(all_stocks) > 0:
            self.save_to_db(all_stocks)
            logger.info(f"종목 파싱 완료: 총 {len(all_stocks)}개")
        else:
            logger.warning("파싱된 종목 없음")

        self.fetch_and_update_sector_codes()
        
        if self.conn:
            self.conn.close()