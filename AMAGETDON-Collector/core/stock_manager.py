from typing import List, Set
from config.config import REDIS_KEYS
from utils.logger import logger

class StockManager:
    
    def __init__(self, redis_client):
        self.redis_client = redis_client
        self.top_stocks_key = REDIS_KEYS['top_30_stocks']
        self.user_stocks_key = REDIS_KEYS['user_stocks']
    
    def get_all_target_stocks(self) -> List[str]:
        try:
            stock_set: Set[str] = set()
            
            top_cached = self.redis_client.smembers(self.top_stocks_key)
            if top_cached:
                stock_set.update(top_cached)
            
            user_keys = self.redis_client.keys(f"{self.user_stocks_key}:*")
            if user_keys:
                stock_codes = [key.split(":")[-1] for key in user_keys]
                stock_set.update(stock_codes)
            
            stocks = list(stock_set)
            logger.info(f"대상 종목: {len(stocks)}개")
            return stocks
            
        except Exception as e:
            logger.error(f"종목 조회 실패: {e}")
            return []