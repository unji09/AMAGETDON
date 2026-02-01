import asyncio
import threading
import time

class RateLimiter:

    def __init__(self, calls_per_second: int = 15):
        self.calls_per_second = calls_per_second
        self.tokens = calls_per_second
        self.last_update = time.time()
        self._thread_lock = threading.Lock()
        self._async_lock = None
        self._loop = None

    def _get_async_lock(self):
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if self._async_lock is None or self._loop != loop:
            self._async_lock = asyncio.Lock()
            self._loop = loop

        return self._async_lock

    def _consume_token(self):
        with self._thread_lock:
            now = time.time()
            elapsed = now - self.last_update

            self.tokens = min(
                self.calls_per_second,
                self.tokens + elapsed * self.calls_per_second
            )
            self.last_update = now

            if self.tokens < 1:
                wait_time = (1 - self.tokens) / self.calls_per_second
                return wait_time
            else:
                self.tokens -= 1
                return 0

    def _after_wait(self):
        with self._thread_lock:
            self.tokens = 0
            self.last_update = time.time()

    # 동기 호출용
    def acquire_sync(self):
        with self._thread_lock:
            now = time.time()
            elapsed = now - self.last_update

            self.tokens = min(
                self.calls_per_second,
                self.tokens + elapsed * self.calls_per_second
            )
            self.last_update = now

            if self.tokens < 1:
                wait_time = (1 - self.tokens) / self.calls_per_second
                time.sleep(wait_time)
                self.tokens = 0
                self.last_update = time.time()
            else:
                self.tokens -= 1

    # 비동기 호출용
    async def acquire(self):
        with self._thread_lock:
            now = time.time()
            elapsed = now - self.last_update

            self.tokens = min(
                self.calls_per_second,
                self.tokens + elapsed * self.calls_per_second
            )
            self.last_update = now

            if self.tokens < 1:
                wait_time = (1 - self.tokens) / self.calls_per_second
                time.sleep(wait_time)
                self.tokens = 0
                self.last_update = time.time()
            else:
                self.tokens -= 1


# API 키별 인스턴스
STOCK_API_LIMITER = RateLimiter(12)
CANDLE_API_LIMITER = RateLimiter(8)
