import pymysql
from core.logger import logger
from config.config import DB_CONFIG

class StockParser:
    
    def __init__(self):
        self.conn = None
    
    def connect_db(self):
        if self.conn is None or not self.conn.open:
            self.conn = pymysql.connect(**DB_CONFIG)
    
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
                        'market': market_type
                    })
            
            logger.info(f"{market_type} 파싱 완료: {len(stocks)}개 (주권만)")
            return stocks
            
        except Exception as e:
            logger.error(f"{filepath} 파싱 실패: {e}")
            return []
    
    def save_to_db(self, stocks):
        self.connect_db()
        cursor = self.conn.cursor()
        
        sql = """
            INSERT INTO stock (stock_code, stock_name, market_type, created_at)
            VALUES (%s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE
            stock_name = VALUES(stock_name)
        """
        
        success = 0
        
        for stock in stocks:
            try:
                cursor.execute(sql, (
                    stock['code'],
                    stock['name'],
                    stock['market']
                ))
                success += 1
            except Exception as e:
                logger.error(f"저장 실패 {stock['code']}: {e}")
        
        self.conn.commit()
        logger.info(f"DB 저장 완료: {success}개")
    
    def parse_and_save(self):
        logger.info("=== 종목 파싱 시작 ===")
        
        kospi_stocks = self.parse_mst_file('./stock_code/kospi_code.mst', 'KOSPI')
        kosdaq_stocks = self.parse_mst_file('./stock_code/kosdaq_code.mst', 'KOSDAQ')
        
        all_stocks = kospi_stocks + kosdaq_stocks
        
        if len(all_stocks) > 0:
            self.save_to_db(all_stocks)
            logger.info(f"=== 파싱 완료: 총 {len(all_stocks)}개 (주권만) ===")
        else:
            logger.warning("파싱된 종목이 없습니다!")
        
        if self.conn:
            self.conn.close()