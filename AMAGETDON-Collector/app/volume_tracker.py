import os
import requests
from typing import List
from core.token_manager import TokenManager
from config.config import REDIS_KEYS
from utils.logger import logger
from utils.market_hours import is_market_open
from utils.db import get_db_connection

class VolumeTracker:

    def __init__(self, token_manager: TokenManager):
        self.token_manager = token_manager
        self.redis_client = token_manager.redis_client
        self.top_stocks_key = REDIS_KEYS['top_30_stocks']
        self.conn = None
    
    def connect_db(self):
        self.conn = get_db_connection(self.conn)

    def get_top_30_volume_stocks(self) -> List[str]:
        try:
            cached = self.redis_client.get(self.top_stocks_key)
            if cached:
                stock_codes = cached.split(',')
                logger.debug(f"Redis에서 TOP 30 가져오기: {len(stock_codes)}개")
                return stock_codes
            
            logger.info("거래량 TOP 30 조회 시작")
            stock_codes = self._fetch_from_api()
            
            filtered = self._filter_existing_stocks(stock_codes)

            if filtered:
                self.redis_client.setex(
                    self.top_stocks_key,
                    300,
                    ','.join(filtered)
                )
                logger.info(f"TOP 30 조회 완료: {len(filtered)}개")
                return filtered  
            else:
                logger.warning("DB에 등록된 종목 아님")
                return []

        except Exception as e:
            logger.error(f"TOP 30 조회 오류: {e}")
            return []
        
    def _filter_existing_stocks(self, stock_codes: List[str]) -> List[str]:
        try:
            self.connect_db()
            cursor = self.conn.cursor()
            
            placeholders = ','.join(['%s'] * len(stock_codes))
            query = f"SELECT stock_code FROM stock WHERE stock_code IN ({placeholders})"
            
            cursor.execute(query, stock_codes)
            results = cursor.fetchall()
            
            existing_codes = {row[0] for row in results}
            
            filtered = []
            for code in stock_codes:
                if code in existing_codes:
                    filtered.append(code)
                    if len(filtered) == 30:
                        break
            
            logger.info(f"필터링 결과: {len(stock_codes)}개 → {len(filtered)}개")
            return filtered
            
        except Exception as e:
            logger.error(f"DB 필터링 실패: {e}")
            return []
    
    def _fetch_from_api(self) -> List[str]:
        try:
            token = self.token_manager.get_token()
            if not token:
                return []
            
            if not is_market_open():
                return []

            url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/volume-rank"
            
            headers = {
                "Content-Type": "application/json; charset=utf-8",
                "authorization": f"Bearer {token}",
                "appkey": os.getenv("API_KEY"),
                "appsecret": os.getenv("API_SECRET"),
                "tr_id": "FHPST01710000",
                "custtype": "P"
            }

            params = {
                "FID_COND_MRKT_DIV_CODE": "J",      
                "FID_COND_SCR_DIV_CODE": "20171",  
                "FID_INPUT_ISCD": "0000",
                "FID_DIV_CLS_CODE": "0",
                "FID_BLNG_CLS_CODE": "0",
                "FID_TRGT_CLS_CODE": "111111111",
                "FID_TRGT_EXLS_CLS_CODE": "0001110111",
                "FID_INPUT_PRICE_1": "",
                "FID_INPUT_PRICE_2": "",
                "FID_VOL_CNT": "",
                "FID_INPUT_DATE_1": ""
            }

            response = requests.get(url, headers=headers, params=params, timeout=10)
            data = response.json()
            
            if data.get("rt_cd") == "0":
                outputs = data.get("output", [])
                stock_codes = [item['mksc_shrn_iscd'] for item in outputs]
                return stock_codes
            else:
                logger.error(f"API 오류: {data.get('msg1')}")
                return []
                
        except requests.Timeout:
            logger.error("API 호출 타임아웃")
            return []
        except Exception as e:
            logger.error(f"API 호출 실패: {e}")
            return []
        
    def close(self):
        if self.conn:
            self.conn.close()