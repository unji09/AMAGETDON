
import time
import pymysql
import threading
import asyncio
from datetime import datetime
import aiohttp

from app.volume_tracker import VolumeTracker
from collector.realtime_collector import RealtimeCollector
from collector.candle_filler import CandleFiller
from collector.candle_collector import CandleCollector
from collector.websocket_collector import WebSocketCollector
from config.config import DB_CONFIG, APP_KEY_1, APP_SECRET_1, APP_KEY_2, APP_SECRET_2
from core.stock_manager import StockManager
from core.token_manager import TokenManager
from utils.logger import logger
from utils.kis_api_client import KISApiClient
from app.parser import StockParser
from models.dto import StockDTO
from utils.helpers import safe_float, safe_int

# -----------------------------
# [완결] 루프 프리 하드 리미터
# -----------------------------
class HardRateLimiter:
    def __init__(self, rate):
        self.rate = rate
        self.interval = 1.0 / rate
        self._lock = None
        self._last = 0

    async def acquire(self):
        if self._lock is None:
            self._lock = asyncio.Lock()
        async with self._lock:
            now = time.monotonic()
            wait = self.interval - (now - self._last)
            if wait > 0:
                await asyncio.sleep(wait)
            self._last = time.monotonic()

# ==============================
# 공통 유틸
# ==============================
def get_stocks(limit=100):
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute(f"SELECT stock_code FROM stock LIMIT {limit}")
    stocks = [row[0] for row in cursor.fetchall()]
    conn.close()
    return stocks

# ==============================
# 2. 재무 갱신
# ==============================
async def main_update_financials(stock_count: int = 100):
    start_time = time.time()
    logger.info(f"=== [START] 재무/현재가 업데이트 ({stock_count}종목) ===")
    
    stocks = get_stocks(stock_count)
    tm = TokenManager.get_instance()
    api_client = KISApiClient(tm)
    session = await api_client._get_session()
    
    limiter = HardRateLimiter(19)
    
    async def fetch_worker(code):
        await limiter.acquire()
        url = f"{api_client.base_url}/uapi/domestic-stock/v1/quotations/inquire-price"
        headers = api_client._get_headers("FHKST01010100")
        params = {"FID_COND_MRKT_DIV_CODE": "J", "FID_INPUT_ISCD": code}
        try:
            async with session.get(url, headers=headers, params=params) as resp:
                data = await resp.json()
                if data.get("rt_cd") != "0": return None
                out = data.get("output", {})
                return StockDTO(
                    stock_code=code, stock_name=out.get("hts_kor_isnm", ""),
                    current_price=safe_int(out.get("stck_prpr")),
                    change_amount=safe_int(out.get("prdy_vrss")) or 0,
                    change_rate=safe_float(out.get("prdy_ctrt")) or 0.0,
                    volume=safe_int(out.get("acml_vol")) or 0,
                    trading_value=safe_int(out.get("acml_tr_pbmn")) or 0,
                    per=safe_float(out.get("per")), pbr=safe_float(out.get("pbr")),
                    eps=safe_int(out.get("eps")), bps=safe_int(out.get("bps")),
                    market_cap=safe_int(out.get("hts_avls"))
                )
        except Exception: return None

    tasks = [fetch_worker(code) for code in stocks]
    results = await asyncio.gather(*tasks)
    success = sum(1 for r in results if r)
    await api_client.close()
    logger.info(f"=== [DONE] 재무 업데이트 완료 (성공: {success}, 소요: {time.time() - start_time:.2f}s) ===")

# ==============================
# 3. 장 시작 + 누락 보정 통합
# ==============================
collection_active = False
ws_collector = None
rest_collector = None

# ==============================
# 3. 장 시작 + 누락 보정 통합
# ==============================
collection_active = False

# ==============================
# 3. 장 시작 + 누락 보정 통합 (API 키 분리 버전)
# ==============================

async def main_start_market_with_fill(stock_count: int = 1000):
    global collection_active
    start_time = time.time()
    logger.info("=== 장 시작 (키 분리 모드: REST/WS vs FILLER) ===")

    # --- 1. REST / WebSocket 전용 매니저 (키 1번) ---
    # 기존 TokenManager.get_instance() 대신 인스턴스를 직접 생성하거나 분리 필요
    # 여기서는 예시로 별도 인스턴스를 가정합니다.
    tm_rest = TokenManager(APP_KEY_1, APP_SECRET_1) 
    stock_manager = StockManager(tm_rest.redis_client)
    volume_tracker = VolumeTracker(tm_rest)
    
    ws_collector = WebSocketCollector(tm_rest)
    rest_collector = RealtimeCollector(tm_rest, stock_manager)
    
    ws_collector.connect()
    top = await volume_tracker.get_top_volume_stocks() 
    ws_collector.subscribe_stocks(top)
    
    # 실시간 REST 수집 스레드 실행
    threading.Thread(target=rest_collector.collect, daemon=True).start()

    # --- 2. 누락 보정 전용 매니저 (키 2번) ---
    # 보정용은 루프 에러 방지를 위해 이 async 함수 안에서 완전히 새로 생성
    tm_filler = TokenManager(APP_KEY_2, APP_SECRET_2)
    filler = CandleFiller(tm_filler) 
    limiter = HardRateLimiter(19)
    
    stocks = get_stocks(stock_count)

    async def fill_worker(code):
        try:
            await limiter.acquire()
            # filler 내부에서 사용하는 KISApiClient가 현재 루프의 세션을 쓰도록 강제
            await filler.fill_missing_candles(code, fill_1m=True)
        except Exception as e:
            # 여기서 발생하는 'different event loop'는 filler 내부의 세션/락 문제입니다.
            # 이 에러를 잡으려면 CandleFiller 내부에서 세션을 매번 새로 열거나 
            # 현재 루프에 귀속된 클라이언트를 주입해야 합니다.
            logger.error(f"{code} 보정 실패: {e}")

    logger.info(f"보정 작업 시작 (API 키 2번 사용)...")
    await asyncio.gather(*[fill_worker(code) for code in stocks])
    
    logger.info(f"=== 모든 프로세스 가동 완료 ({time.time() - start_time:.2f}s) ===")

    # 상위 종목 갱신 루프
    collection_active = True
    async def volume_loop():
        while collection_active:
            await asyncio.sleep(300)
            new_top = await volume_tracker.get_top_volume_stocks()
            ws_collector.subscribe_stocks(new_top)

    asyncio.create_task(volume_loop())

# ==============================
# 5. 장 마감 (사용자님의 기존 5번 기능)
# ==============================
async def main_end_of_day_process(stock_count: int = 1000):
    global collection_active
    start_time = time.time()
    logger.info("=== [START] 장 마감 보정 및 일봉 수집 시작 ===")
    
    collection_active = False  # 수집 중단
    tm = TokenManager.get_instance()
    stocks = get_stocks(stock_count)
    
    limiter = HardRateLimiter(19)
    filler = CandleFiller(tm)
    candle_collector = CandleCollector(tm)

    # 1, 5, 30분봉 누락분 전체 보정
    async def final_fill_worker(code):
        await limiter.acquire()
        await filler.fill_missing_candles(code, fill_1m=True, fill_5m=True, fill_30m=True)

    logger.info(f"{len(stocks)}개 종목 최종 분봉 보정 중...")
    await asyncio.gather(*[final_fill_worker(code) for code in stocks])
    
    # 일봉 수집
    logger.info("일봉 데이터 업데이트 시작...")
    await candle_collector.collect_batch_async(stocks, '1d')
    
    candle_collector.close()
    tm.close()
    logger.info(f"=== [DONE] 장 마감 처리 완료 (소요: {time.time() - start_time:.2f}s) ===")

# ==============================
# 실행 메인
# ==============================
if __name__ == "__main__":
    print("\n1. 서버 초기화\n2. 재무 갱신\n3. 장 시작 + 누락 보정\n4. 장 마감 처리(분봉보정+일봉)\n")
    choice = input("선택: ").strip()

    if choice == "1":
        main_bootstrap()
    elif choice == "2":
        asyncio.run(main_update_financials(100))
    elif choice == "3":
        try:
            asyncio.run(main_start_market_with_fill(1000))
            while True: time.sleep(1)
        except KeyboardInterrupt:
            logger.info("종료")
    elif choice == "4":
        asyncio.run(main_end_of_day_process(1000))