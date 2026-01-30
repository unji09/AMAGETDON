import redis
import time
import threading
from datetime import datetime, timedelta
from typing import Dict
from core.token_manager import TokenManager
from utils.logger import logger
from config.config import REDIS_KEYS
from collector.candle_filler import CandleFiller 

class RealtimeCandleMonitor:

    def __init__(self, redis_host='host.docker.internal', redis_port=6379):
        self.redis = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
        self.token_manager = TokenManager.get_instance()
        self.candle_filler = CandleFiller(self.token_manager)
        self.running = False
        self.top_stocks_key = REDIS_KEYS['top_30_stocks']
        self.user_stocks_key = REDIS_KEYS['user_stocks']
        self.last_fill_time: Dict[str, datetime] = {}

    #캔들 보정 시작
    def start(self):
        self.running = True
        logger.info("RealtimeCandleMonitor 시작")

        while self.running:
            try:
                self._process_requests()
                time.sleep(1)
            except Exception as e:
                logger.error(f"RealtimeCandleMonitor 오류: {e}")
                time.sleep(5)

    def start_async(self):
        thread = threading.Thread(target=self.start, daemon=True)
        thread.start()
        return thread

    #5분마다 종목별 캔들 보정
    def _process_requests(self):
        all_stocks = set()

        top_stocks = self.redis.smembers(self.top_stocks_key)
        if top_stocks:
            all_stocks.update(top_stocks)

        user_stocks = self.redis.smembers(self.user_stocks_key)
        if user_stocks:
            all_stocks.update(user_stocks)

        if not all_stocks:
            return

        now = datetime.now()

        for stock_code in all_stocks:
            last_time = self.last_fill_time.get(stock_code)

            if last_time is None or (now - last_time) >= timedelta(minutes=5):
                try:
                    self.candle_filler.fill_missing_candles(
                        stock_code=stock_code,
                        target_date=now.date(),
                        fill_1m=True,
                        fill_5m=True,
                        fill_30m=True
                    )
                    self.last_fill_time[stock_code] = now
                except Exception as e:
                    logger.error(f"{stock_code} 실시간 보정 실패: {e}")
                
                time.sleep(0.05)

    def stop(self):
        self.running = False
        self.candle_filler.close()
