import pymysql
import requests
import time
import os
from datetime import datetime
from config.config import DB_CONFIG
from core.token_manager import TokenManager 
from core.logger import logger
from models.dto import StockDTO
from typing import Optional, List
from core.market_hours import is_market_open

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
    
    def __init__(self, token_manager: TokenManager):
        self.conn = None
        self.token_manager = token_manager
        self.redis_client = token_manager.redis_client
        self.top_stocks_key = 'kis:top_30_stocks'
        self.user_stocks_key = 'kis:user_stocks'
    
    def connect_db(self):
        if self.conn is None or not self.conn.open:
            self.conn = pymysql.connect(**DB_CONFIG)
    
    def get_user_stocks_excluding_top30(self) -> List[str]:
        try:
            user_cached = self.redis_client.get(self.user_stocks_key)
            if not user_cached:
                return []
            
            user_stocks = set(user_cached.split(','))
            
            top_cached = self.redis_client.get(self.top_stocks_key)
            if top_cached:
                top_30 = set(top_cached.split(','))
                return list(user_stocks - top_30)
            
            return list(user_stocks)
            
        except Exception as e:
            logger.error(f"종목 조회 실패: {e}")
            return []

    def fetch_price(self, stock_code: str) -> Optional[StockDTO]:
        if not is_market_open():
            return None

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

            response = requests.get(url, headers=headers, params=params, timeout=10)
            data = response.json()

            if data.get("rt_cd") != "0":
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
                stock_name=output.get("hts_kor_isnm", ""),
                current_price=current_price,
                change_amount=change_amount,
                change_rate=change_rate,
                volume=volume,
                trading_value=trading_value
            )

        except Exception as e:
            logger.error(f"{stock_code} 호출 실패: {e}")
            return None
    
    def save_price(self, stock: StockDTO):
        try:
            self.connect_db()
            cursor = self.conn.cursor()

            sql = """
                INSERT INTO stock_prices
                (stock_code, current_price, volume, trading_value, change_amount, change_rate, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """

            cursor.execute(sql, (
                stock.stock_code,
                stock.current_price,
                stock.volume,
                stock.trading_value,
                stock.change_amount,
                stock.change_rate,
                datetime.now()
            ))

            self.conn.commit()

        except Exception as e:
            logger.error(f"{stock.stock_code} 저장 실패: {e}")
    
    def collect(self):
        while True:
            start_time = time.time()
            
            stock_codes = self.get_user_stocks_excluding_top30()
            
            if not stock_codes:
                logger.debug("수집할 종목 없음")
                time.sleep(5)
                continue
            
            total = len(stock_codes)
            processed = 0

            logger.info(f"종목 수집 시작: {total}개")

            for code in stock_codes:
                try:
                    stock = self.fetch_price(code)

                    if stock:
                        self.save_price(stock)
                        processed += 1

                    time.sleep(0.05)

                except Exception as e:
                    logger.error(f"{code} 처리 실패: {e}")

            elapsed = time.time() - start_time
            logger.info(f"수집 완료: {processed}/{total}개 (소요: {elapsed:.2f}초)")
            
            if elapsed < 5:
                wait_time = 5 - elapsed
                time.sleep(wait_time)
    
    def close(self):
        if self.conn:
            self.conn.close()