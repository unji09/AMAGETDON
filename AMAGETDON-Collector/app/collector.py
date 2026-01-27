import pymysql
import requests
import time
import os
from datetime import datetime
from config.config import DB_CONFIG
from core.token_manager import TokenManager 
from logger import logger
from models.dto import StockDTO
from typing import Optional

def safe_int(value: str) -> Optional[int]:
        if not value or value.strip() == '':
            return None
        try:
            return int(value)
        except (ValueError, TypeError):
            return None

def safe_float(value: str) -> Optional[float]:
    if not value or value.strip() == '':
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None
        
class RealtimeCollector:
    
    def __init__(self):
        self.conn = None

        self.token_manager = TokenManager(
            redis_host='host.docker.internal',
            redis_port=6379
        )
    
    def connect_db(self):
        if self.conn is None or not self.conn.open:
            self.conn = pymysql.connect(**DB_CONFIG)
    
    def get_all_stocks(self):
        self.connect_db()
        cursor = self.conn.cursor()
        
        cursor.execute("SELECT stock_code, stock_name FROM stock")
        
        return cursor.fetchall()

    def fetch_price(self, stock_code: str) -> Optional[StockDTO]:
        try:
            token = self.token_manager.get_token()
            if not token:
                return None

            url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-price"

            headers = {
                "Content-Type": "application/json; charset=utf-8",
                "authorization": f"Bearer {token}",
                "appkey": os.getenv("API_KEY"),
                "appsecret": os.getenv("API_SECRET"),
                "tr_id": "FHKST01010100",
                "custtype": "P"
            }

            params = {
                "FID_COND_MRKT_DIV_CODE": "J",
                "FID_INPUT_ISCD": stock_code
            }

            response = requests.get(url, headers=headers, params=params)
            data = response.json()

            if data.get("rt_cd") != "0":
                logger.error(f"{stock_code} API 오류: {data.get('msg1')}")
                return None

            output = data.get("output", {})

            current_price = safe_int(output.get("stck_prpr"))
            if current_price is None:
                return None

            volume = safe_int(output.get("acml_vol")) or 0
            trading_value = safe_int(output.get("acml_tr_pbmn")) or 0
            change_amount = safe_int(output.get("prdy_vrss")) or 0
            change_rate = safe_float(output.get("prdy_ctrt")) or 0.0

            return StockDTO(
                stock_code=stock_code,
                stock_name=output.get("stck_shrn_iscd", ""),
                current_price=current_price,
                change_amount=change_amount,
                change_rate=change_rate,
                volume=volume,
                trading_value=trading_value
            )

        except Exception as e:
            logger.error(f"{stock_code} 호출 실패: {e}")
            return None
    
    def save_prices_batch(self, stocks: list[StockDTO]):
        if not stocks:
            return

        self.connect_db()
        cursor = self.conn.cursor()

        sql = """
            INSERT INTO stock_prices
            (stock_code, current_price, volume, trading_value, change_amount, change_rate, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """

        for s in stocks:
            cursor.execute(sql, (
                s.stock_code,
                s.current_price,
                s.volume,
                s.trading_value,
                s.change_amount,
                s.change_rate,
                datetime.now()
            ))

        self.conn.commit()
    
    def collect(self):
        logger.info("=== 실시간 시세 수집 시작 ===")
        
        try:
            all_stocks = self.get_all_stocks()
            stock_codes = [code for code, name in all_stocks]
            total = len(stock_codes)
            logger.debug(total)
            processed = 0

            for code in stock_codes:
                try:
                    stock = self.fetch_price(code)

                    if stock:
                        self.save_prices_batch([stock])
                        processed += 1

                    time.sleep(0.05)

                except Exception as e:
                    logger.error(f"{code} 처리 실패: {e}")

            logger.info(f"=== 수집 완료 {processed}/{total} ===")

        except Exception as e:
            logger.error(f"수집 중 오류: {e}")
    
    def close(self):
        if self.conn:
            self.conn.close()
        
        self.token_manager.close()