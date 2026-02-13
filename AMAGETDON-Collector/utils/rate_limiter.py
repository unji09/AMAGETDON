import asyncio
import time
import threading
import aiohttp
from dataclasses import dataclass, field
from typing import Optional
from utils.logger import logger


@dataclass
class BatchRetryStats:
    success_count: int = 0
    fail_count: int = 0
    retry_count: int = 0
    start_time: float = field(default_factory=time.time)

    def record_success(self, retries: int = 0):
        self.success_count += 1
        self.retry_count += retries

    def record_fail(self):
        self.fail_count += 1

    def get_elapsed_time(self) -> float:
        return time.time() - self.start_time

    def log_summary(self, batch_name: str):
        elapsed = self.get_elapsed_time()
        logger.info(
            f"{batch_name}: {self.success_count}성공, {self.fail_count}실패, "
            f"{self.retry_count}재시도, {elapsed:.1f}초"
        )

    def reset(self):
        self.success_count = 0
        self.fail_count = 0
        self.retry_count = 0
        self.start_time = time.time()


async def retry_on_failure(
    func,
    max_retries: int = 3,
    retry_delay: float = 1.0,
    context: str = "",
    silent: bool = True
):
    last_error = None

    for attempt in range(max_retries + 1):
        try:
            result = await func()
            return result, attempt

        except (aiohttp.ClientError, asyncio.TimeoutError, ConnectionError) as e:
            last_error = e
            if attempt < max_retries:
                if not silent:
                    logger.warning(f"[재시도 {attempt + 1}/{max_retries}] {context} - 연결 오류: {e}")
                await asyncio.sleep(retry_delay * (attempt + 1))
            else:
                if not silent:
                    logger.error(f"[재시도 실패] {context} - {max_retries}회 재시도 후 실패: {e}")

        except Exception as e:
            last_error = e
            if not silent:
                logger.error(f"[오류] {context} - 예상치 못한 오류: {e}")
            break

    return None, 0


def is_api_error(data: dict) -> bool:
    if not data:
        return False

    rt_cd = data.get("rt_cd")
    msg1 = data.get("msg1", "").lower()

    if rt_cd == "0":
        return False

    if "token" in msg1:
        return False

    return True


class HardRateLimiter:
    def __init__(self, rate):
        self._lock = None
        self._thread_lock = threading.Lock()
        self._interval = 1.0 / rate
        self._last = 0
        self._call_count = 0
        
    #Lock 생성
    def _ensure_lock(self):
        if self._lock is None:
            with self._thread_lock:
                if self._lock is None:
                    self._lock = asyncio.Lock()

    
    async def acquire(self):
        self._ensure_lock()
        async with self._lock:
            now = time.monotonic()
            wait = self._interval - (now - self._last)
            if wait > 0:
                await asyncio.sleep(wait)
            self._last = time.monotonic()
            self._call_count += 1

    def get_call_count(self):
        return self._call_count

    def reset_call_count(self):
        self._call_count = 0

