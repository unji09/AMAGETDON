import asyncio
import time
import threading
import aiohttp
from dataclasses import dataclass, field
from typing import Optional
from utils.logger import logger


@dataclass
class BatchRetryStats:
    """배치 처리의 재시도 통계를 관리하는 클래스"""
    success_count: int = 0
    fail_count: int = 0
    retry_count: int = 0
    start_time: float = field(default_factory=time.time)

    def record_success(self, retries: int = 0):
        """성공 기록"""
        self.success_count += 1
        self.retry_count += retries

    def record_fail(self):
        """실패 기록"""
        self.fail_count += 1

    def get_elapsed_time(self) -> float:
        """경과 시간 반환"""
        return time.time() - self.start_time

    def log_summary(self, batch_name: str):
        """배치 요약 로그 출력"""
        elapsed = self.get_elapsed_time()
        logger.info(
            f"{batch_name}: {self.success_count}성공, {self.fail_count}실패, "
            f"{self.retry_count}재시도, {elapsed:.1f}초"
        )

    def reset(self):
        """통계 초기화"""
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
    """
    API 호출 실패 시 재시도하는 래퍼 함수

    실패 기준:
    - 네트워크 연결 에러 (aiohttp.ClientError)
    - 타임아웃 (asyncio.TimeoutError)
    - rt_cd가 "0"이 아닌 경우 (빈 데이터 제외)

    Args:
        func: 실행할 비동기 함수 (람다나 partial로 감싸서 전달)
        max_retries: 최대 재시도 횟수
        retry_delay: 재시도 간 대기 시간(초)
        context: 로그용 컨텍스트 문자열
        silent: True면 개별 재시도 로그 생략 (배치 요약용)

    Returns:
        tuple: (결과, 재시도_성공_횟수) - 재시도 후 성공한 경우만 횟수 반환, 실패하면 0
    """
    last_error = None

    for attempt in range(max_retries + 1):
        try:
            result = await func()
            # 성공: 재시도 후 성공한 경우만 attempt 반환
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

    # 실패: 재시도 횟수는 0으로 반환 (실패한 경우 재시도 성공이 아니므로)
    return None, 0


def is_api_error(data: dict) -> bool:
    """
    API 응답이 에러인지 확인 (토큰 만료 제외)

    Args:
        data: API 응답 딕셔너리

    Returns:
        bool: 재시도가 필요한 에러인 경우 True
    """
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

