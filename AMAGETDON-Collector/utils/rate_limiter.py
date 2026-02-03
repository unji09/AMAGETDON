import asyncio
import time
import threading

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

