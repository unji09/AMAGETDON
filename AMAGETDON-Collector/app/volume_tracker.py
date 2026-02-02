from typing import List
from core.token_manager import TokenManager
from config.config import REDIS_KEYS
from utils.logger import logger
from utils.db import get_db_connection
from utils.kis_api_client import KISApiClient

class VolumeTracker:

    def __init__(self, token_manager: TokenManager):
        self.token_manager = token_manager
        self.redis_client = token_manager.redis_client
        self.top_stocks_key = REDIS_KEYS['top_10_stocks']
        self.conn = None
        self.api_client = KISApiClient(token_manager)

    async def close(self):
        """세션 정리"""
        await self.api_client.close()
    
    def connect_db(self):
        self.conn = get_db_connection(self.conn)

    #거래량 top 조회
    async def get_top_volume_stocks(self) -> List[str]:
        try:
            logger.info("거래량 TOP 10 조회 시작")
            stock_codes = await self.api_client.fetch_from_api()

            filtered = self._filter_existing_stocks(stock_codes)

            if filtered:
                self.redis_client.delete(self.top_stocks_key)
                self.redis_client.rpush(self.top_stocks_key, *filtered)
                logger.info(f"TOP 10 조회 완료: {len(filtered)}개")
                return filtered
            else:
                logger.warning("DB에 등록된 종목 아님")
                return []

        except Exception as e:
            logger.error(f"TOP 10 조회 오류: {e}")
            return []
    
    #테이블에 있는 종목으로 필터링
    def _filter_existing_stocks(self, stock_codes: List[str]) -> List[str]:
        try:
            if not stock_codes:
                logger.warning("필터링할 종목이 없음")
                return []
            
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
                    if len(filtered) == 10:
                        break
            
            logger.info(f"필터링 결과: {len(stock_codes)}개 → {len(filtered)}개")
            return filtered
            
        except Exception as e:
            logger.error(f"DB 필터링 실패: {e}")
            return []
    