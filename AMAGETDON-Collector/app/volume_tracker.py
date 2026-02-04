from typing import List, Optional
from core.token_manager import TokenManager
from config.config import REDIS_KEYS
from utils.logger import logger
from utils.db import get_db_connection
from utils.kis_api_client import KISApiClient
from utils.rate_limiter import HardRateLimiter

class VolumeTracker:

    def __init__(self, token_manager: TokenManager, shared_limiter: Optional[HardRateLimiter] = None):
        self.token_manager = token_manager
        self.redis_client = token_manager.redis_client
        self.top_stocks_key = REDIS_KEYS['top_10_stocks']
        self.conn = None
        self.api_client = KISApiClient(token_manager)
        
        # 외부에서 공유 limiter 받거나 없으면 내부 limiter 사용
        self.shared_limiter = shared_limiter
        
        # 조건식 seq (장 시작 전 목록조회로 설정)
        self.condition_seq: Optional[str] = None

    async def close(self):
        """세션 정리"""
        await self.api_client.close()
    
    def connect_db(self):
        self.conn = get_db_connection(self.conn)

    async def get_top_volume_stocks(self) -> List[str]:
        """
        종목조건검색 조회 (5분마다)
        - 조건에 맞는 100개 종목 조회
        - DB 필터링 → 순서대로 10개 Redis 저장
        """
        try:
            logger.info("종목조건검색 조회 시작")
            
            # 공유 limiter 사용 (다른 API와 함께 1초 20건 제한)
            stock_codes = await self.api_client.fetch_condition_search(
                seq="0",
                limiter=self.shared_limiter
            )

            if not stock_codes:
                logger.warning("조건검색 결과 없음")
                return []

            # DB 필터링 → 순서대로 10개
            filtered = self._filter_existing_stocks(stock_codes)

            if filtered:
                # TTL 없이, 기존 데이터 삭제 후 새로 저장
                self.redis_client.delete(self.top_stocks_key)
                self.redis_client.rpush(self.top_stocks_key, *filtered)
                logger.info(f"TOP 10 저장 완료: {filtered}")
                return filtered
            else:
                logger.warning("DB에 등록된 종목 없음")
                return []

        except Exception as e:
            logger.error(f"종목조건검색 조회 오류: {e}")
            return []
    
    def _filter_existing_stocks(self, stock_codes: List[str]) -> List[str]:
        """
        DB에 있는 종목만 필터링, 순서 유지하면서 최대 10개 반환
        """
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
            
            # 원래 순서 유지하면서 DB에 있는 것만, 최대 10개
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