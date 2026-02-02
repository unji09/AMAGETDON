import asyncio
import time

# 정확히 초당 N건 제한 (burst 없음)
# 이벤트 루프 독립적으로 동작하도록 수정
class HardRateLimiter:
    def __init__(self, rate):
        self._lock = None  # 지연 초기화
        self._interval = 1.0 / rate
        self._last = 0

    async def acquire(self):
        # 현재 이벤트 루프에서 Lock 생성 (루프별 독립)
        if self._lock is None:
            self._lock = asyncio.Lock()
        async with self._lock:
            now = time.monotonic()
            wait = self._interval - (now - self._last)
            if wait > 0:
                await asyncio.sleep(wait)
            self._last = time.monotonic()


# API 키별 인스턴스
STOCK_API_LIMITER = HardRateLimiter(15)
CANDLE_API_LIMITER = HardRateLimiter(2)

