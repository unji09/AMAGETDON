import asyncio
import threading
import time

class AsyncRateLimiter:

    def __init__(self, calls_per_second: int = 15):
        self.calls_per_second = calls_per_second
        self.tokens = 0
        self.last_update = time.time()
        self._lock = None
        self._thread_lock = threading.Lock()
    
    def _get_lock(self):
        if self._lock is None:
            self._lock = asyncio.Lock()
        return self._lock
    
    #api 여러개 호출할 때 처리
    async def acquire(self):
        while True:
            lock = self._get_lock()
            async with lock:
                now = time.time()
                elapsed = now - self.last_update
                
                self.tokens = min(
                    self.calls_per_second,
                    self.tokens + elapsed * self.calls_per_second
                )
                self.last_update = now
                
                if self.tokens >= 1:
                    self.tokens -= 1
                    return
                
                wait_time = (1 - self.tokens) / self.calls_per_second
            
            await asyncio.sleep(wait_time)


class SyncRateLimiter:
    
    def __init__(self, calls_per_second: int = 15):
        self.calls_per_second = calls_per_second
        self.tokens = 0
        self.last_update = time.time()
        self._lock = threading.Lock()
    
    #api 하나 호출할 때 처리
    def acquire(self):
        with self._lock:
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
            
            self.tokens -= 1



# 글로벌 인스턴스 (API 키별)
STOCK_API_LIMITER = AsyncRateLimiter(15)
CANDLE_API_LIMITER = AsyncRateLimiter(15)
STOCK_API_SYNC_LIMITER = SyncRateLimiter(15)
CANDLE_API_SYNC_LIMITER = SyncRateLimiter(15)
