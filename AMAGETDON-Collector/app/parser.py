import os
import pymysql
import csv
import time
import asyncio
import aiohttp
from datetime import datetime
from config.config import DB_CONFIG
from utils.logger import logger
from utils.kis_api_client import KISApiClient
from utils.rate_limiter import HardRateLimiter, BatchRetryStats
from utils.db import delete_stocks
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
    async def fetch_and_update_sector_codes(self):
        self.connect_db()
        cursor = self.conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM stock WHERE sector_code != '000000'")
        updated_count = cursor.fetchone()[0]

        if updated_count > 0:
            logger.info(f"업종 코드 이미 업데이트됨: {updated_count}개 - 스킵")
            return

        cursor.execute("SELECT stock_code FROM stock WHERE sector_code = '000000'")
        stock_codes = [row[0] for row in cursor.fetchall()]

        logger.info(f"총 {len(stock_codes)}개 종목 업종 코드 수집 시작")

        token_manager = TokenManager.get_instance()
        api_client = KISApiClient(token_manager)
        limiter = HardRateLimiter(18)

        cursor.execute("SELECT sector_code FROM sector WHERE sector_level = 'SMALL'")
        db_sector_codes = set(row[0] for row in cursor.fetchall())

        logger.info(f"DB 소분류 업종 코드: {len(db_sector_codes)}개")

        start_time = time.time()
        success_count = 0
        fail_count = 0
        total_retries = 0
        stopped_stocks = []
        batch_size = 100
        total_batches = (len(stock_codes) + batch_size - 1) // batch_size

        #업종 코드 조회
        async def fetch_sector_code(session, stock_code):
            result, retry_count = await api_client.fetch_sector_code_direct(
                session, stock_code, limiter, return_retry_count=True
            )
            return stock_code, result, retry_count

        connector = aiohttp.TCPConnector(limit=18)
        timeout = aiohttp.ClientTimeout(total=600)
        session = aiohttp.ClientSession(connector=connector, timeout=timeout)

        try:
            for batch_idx in range(total_batches):
                batch_stats = BatchRetryStats()
                batch_start = batch_idx * batch_size
                batch_end = min(batch_start + batch_size, len(stock_codes))
                batch_codes = stock_codes[batch_start:batch_end]

                tasks = [fetch_sector_code(session, code) for code in batch_codes]
                batch_results = await asyncio.gather(*tasks)

                for stock_code, result, retry_count in batch_results:
                    if result:
                        sector_code = result['sector_code']
                        tr_stop_yn = result['tr_stop_yn']
                        scts_abol_dt = result.get('scts_mket_lstg_abol_dt', '')
                        kosdaq_abol_dt = result.get('kosdaq_mket_lstg_abol_dt', '')

                        # 거래 정지 종목 처리
                        if tr_stop_yn == 'Y':
                            stopped_stocks.append(stock_code)
                            logger.info(f"{stock_code}: 거래 정지 종목 - 삭제 대상")
                            continue

                        # 상장폐지일 확인
                        today = datetime.now().strftime('%Y%m%d')
                        abol_dt = scts_abol_dt or kosdaq_abol_dt
                        if abol_dt and abol_dt <= today:
                            stopped_stocks.append(stock_code)
                            logger.info(f"{stock_code}: 상장폐지 종목 (폐지일: {abol_dt}) - 삭제 대상")
                            continue

                        if sector_code in db_sector_codes:
                            cursor.execute("""
                                UPDATE stock
                                SET sector_code = %s, updated_at = NOW()
                                WHERE stock_code = %s
                            """, (sector_code, stock_code))
                            success_count += 1
                            batch_stats.record_success(retry_count)
                            total_retries += retry_count
                        else:
                            fail_count += 1
                            batch_stats.record_fail()
                            logger.warning(f"{stock_code}: 업종 '{sector_code}' DB에 없음")
                    else:
                        fail_count += 1
                        batch_stats.record_fail()
                        logger.warning(f"{stock_code}: 업종 코드 API 조회 실패")

                self.conn.commit()

                batch_stats.log_summary(f"업종 코드 배치 {batch_idx + 1}/{total_batches}")

        finally:
            await session.close()
            await api_client.close()

        # 거래 정지 종목 삭제
        if stopped_stocks:
            delete_stocks(self.conn, stopped_stocks)
            logger.info(f"거래 정지 종목 {len(stopped_stocks)}개 삭제 완료")

        elapsed = time.time() - start_time
        logger.info(f"업종 코드 수집 완료: {success_count}성공, {fail_count}실패, {len(stopped_stocks)}거래정지, {total_retries}재시도, {elapsed:.1f}초")

        token_manager.close()

    async def parse_and_save(self):
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

        await self.fetch_and_update_sector_codes()
        
        if self.conn:
            self.conn.close()