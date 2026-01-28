import json
import websocket
import threading
import socket
import time
from typing import List
from datetime import datetime
import pymysql
import ssl

from core.logger import logger
from core.token_manager import TokenManager
from models.dto import StockDTO
from config.config import DB_CONFIG
import websocket
websocket.enableTrace(True)


def safe_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def safe_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


class WebSocketCollector:

    def __init__(self, token_manager: TokenManager):
        self.token_manager = token_manager
        self.ws = None
        self.ws_thread = None
        self.conn = None

        self.approval_key = None
        self.connected = False
        self.reconnect_enabled = True
        self.subscribed_stocks = set()

    def connect_db(self):
        if self.conn is None or not self.conn.open:
            self.conn = pymysql.connect(**DB_CONFIG)

    def connect(self) -> bool:
        if self.connected:
            logger.info("이미 WebSocket 연결됨")
            return True

        self.approval_key = self.token_manager.get_approval_key()
        if not self.approval_key:
            logger.error("Approval Key 발급 실패")
            return False

       # old_getaddrinfo = socket.getaddrinfo
       # def ipv4_only(host, port, family=0, type=0, proto=0, flags=0):
       #     return old_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
       # socket.getaddrinfo = ipv4_only

        socket.setdefaulttimeout(10)
        websocket.enableTrace(False)

        ws_url = "wss://ops.koreainvestment.com:21000"

        self.ws = websocket.WebSocketApp(
            ws_url,
            on_open=self.on_open,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close
        )

        self.ws_thread = threading.Thread(
            target=self.ws.run_forever,
            kwargs={
                "ping_interval": 30,
                "ping_timeout": 10,
                "sslopt": {"cert_reqs": 0, "check_hostname": False, "ssl_version": ssl.PROTOCOL_TLSv1_2}
            },
            daemon=True
        )
        self.ws_thread.start()

        logger.info("WebSocket 연결 시도 중...")

        for _ in range(20):
            if self.connected:
                logger.info("✅ WebSocket 연결 성공")
                return True
            time.sleep(0.5)

        logger.error("❌ WebSocket 연결 실패 (on_open 미호출)")
        return False

    def subscribe_stocks(self, stock_codes: List[str]):
        if not self.connected or not self.ws:
            logger.error("WebSocket 미연결 상태")
            return

        new = set(stock_codes) - self.subscribed_stocks
        removed = self.subscribed_stocks - set(stock_codes)

        for code in removed:
            self._unsubscribe(code)

        for code in new:
            self._subscribe(code)

        logger.info(f"구독 갱신 +{len(new)} / -{len(removed)}")

    def _subscribe(self, stock_code: str):
        msg = {
            "header": {
                "approval_key": self.approval_key,
                "custtype": "P",
                "tr_type": "1",
                "content-type": "utf-8"
            },
            "body": {
                "input": {
                    "tr_id": "H0STCNT0",
                    "tr_key": stock_code
                }
            }
        }
        self.ws.send(json.dumps(msg))
        self.subscribed_stocks.add(stock_code)

    def _unsubscribe(self, stock_code: str):
        msg = {
            "header": {
                "approval_key": self.approval_key,
                "custtype": "P",
                "tr_type": "2",
                "content-type": "utf-8"
            },
            "body": {
                "input": {
                    "tr_id": "H0STCNT0",
                    "tr_key": stock_code
                }
            }
        }
        self.ws.send(json.dumps(msg))
        self.subscribed_stocks.discard(stock_code)

    def on_open(self, ws):
        self.connected = True
        logger.info("WebSocket OPEN")

    def on_message(self, ws, message):
        try:
            data = json.loads(message)
            if data.get("header", {}).get("tr_id") != "H0STCNT0":
                return

            output = data.get("body", {}).get("output", {})
            price = safe_int(output.get("STCK_PRPR"))
            if price is None:
                return

            stock = StockDTO(
                stock_code=output.get("MKSC_SHRN_ISCD"),
                stock_name=output.get("HTS_KOR_ISNM", ""),
                current_price=price,
                volume=safe_int(output.get("ACML_VOL")) or 0,
                trading_value=safe_int(output.get("ACML_TR_PBMN")) or 0,
                change_amount=(safe_int(output.get("PRDY_VRSS")) or 0)
                * (-1 if output.get("PRDY_VRSS_SIGN") in ("4", "5") else 1),
                change_rate=safe_float(output.get("PRDY_CTRT")) or 0.0
            )

            self.save_to_db(stock)

        except Exception as e:
            logger.error(f"메시지 처리 오류: {e}")

    def on_error(self, ws, error):
        logger.error(f"WebSocket ERROR: {error}")
        self.connected = False

    def on_close(self, ws, status, msg):
        logger.warning(f"WebSocket CLOSE: {status}, {msg}")
        self.connected = False
        self.subscribed_stocks.clear()

        if self.reconnect_enabled:
            time.sleep(10)
            self.connect()

    def save_to_db(self, stock: StockDTO):
        try:
            self.connect_db()
            with self.conn.cursor() as cursor:
                sql = """
                    INSERT INTO stock_prices
                    (stock_code, current_price, volume, trading_value,
                     change_amount, change_rate, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(sql, (
                    stock.stock_code,
                    stock.current_price,
                    stock.volume,
                    stock.trading_value,
                    stock.change_amount,
                    stock.change_rate,
                    datetime.now()
                ))
            self.conn.commit()
        except Exception as e:
            logger.error(f"DB 저장 실패 [{stock.stock_code}]: {e}")

    def close(self):
        self.reconnect_enabled = False
        self.connected = False
        if self.ws:
            self.ws.close()
        if self.conn:
            self.conn.close()
