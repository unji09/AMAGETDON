import asyncio
import time
from datetime import datetime
import aiohttp
import logging

# -----------------------------
# 로거 설정
# -----------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# -----------------------------
# 하드 리미터
# -----------------------------
class HardRateLimiter:
    def __init__(self, rate):
        self.rate = rate
        self.interval = 1.0 / rate
        self._lock = asyncio.Lock()
        self._last = 0

    async def acquire(self):
        async with self._lock:
            now = time.monotonic()
            wait = self.interval - (now - self._last)
            if wait > 0:
                await asyncio.sleep(wait)
            self._last = time.monotonic()

# -----------------------------
# API 호출 (예시)
# -----------------------------
async def fetch_minute_candles(session, code, date, limiter):
    try:
        await limiter.acquire()
        async with session.get("https://httpbin.org/delay/0.1") as resp:
            if resp.status == 200:
                logger.info(f"[MINUTE] {code} 성공")
                return True
            else:
                logger.error(f"[MINUTE] {code} 실패 status={resp.status}")
                return False
    except Exception as e:
        logger.error(f"[MINUTE] {code} 예외: {e}")
        return False

async def fetch_daily_candles(session, code, limiter):
    try:
        await limiter.acquire()
        async with session.get("https://httpbin.org/delay/0.1") as resp:
            if resp.status == 200:
                logger.info(f"[DAILY] {code} 성공")
                return True
            else:
                logger.error(f"[DAILY] {code} 실패 status={resp.status}")
                return False
    except Exception as e:
        logger.error(f"[DAILY] {code} 예외: {e}")
        return False

async def fetch_volume_rank(session, limiter):
    try:
        await limiter.acquire()
        async with session.get("https://httpbin.org/delay/0.1") as resp:
            if resp.status == 200:
                logger.info("[VOLUME] 성공")
                return True
            else:
                logger.error(f"[VOLUME] 실패 status={resp.status}")
                return False
    except Exception as e:
        logger.error(f"[VOLUME] 예외: {e}")
        return False

# -----------------------------
# 메인
# -----------------------------
async def main():
    stocks = [f"{i:06d}" for i in range(100)]
    target_date = datetime.now().strftime("%Y%m%d")

    limiter = HardRateLimiter(20)

    async with aiohttp.ClientSession() as session:
        minute_tasks = [
            fetch_minute_candles(session, code, target_date, limiter)
            for code in stocks
        ]

        daily_tasks = [
            fetch_daily_candles(session, code, limiter)
            for code in stocks
        ]

        volume_tasks = [
            fetch_volume_rank(session, limiter)
            for _ in range(30)
        ]

        all_tasks = minute_tasks + daily_tasks + volume_tasks

        logger.info(f"총 요청 수: {len(all_tasks)}")
        start = time.time()
        results = await asyncio.gather(*all_tasks)
        end = time.time()

    success = sum(1 for r in results if r)
    fail = len(results) - success

    logger.info("================================")
    logger.info(f"성공: {success}")
    logger.info(f"실패: {fail}")
    logger.info(f"총 소요 시간: {round(end - start, 2)} 초")
    logger.info(f"초당 평균: {round(len(results)/(end-start), 2)} req/s")
    logger.info("================================")

# -----------------------------
# 실행
# -----------------------------
if __name__ == "__main__":
    asyncio.run(main())
