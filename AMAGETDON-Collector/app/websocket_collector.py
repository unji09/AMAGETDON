import json
import websocket
import threading
from typing import List
from core.token_manager import TokenManager
from models.dto import StockDTO
from utils.logger import logger
from utils.helpers import safe_int, safe_float
from utils.db import get_db_connection, save_stock_price

class WebSocketCollector:
    
    def __init__(self, token_manager: TokenManager):
        self.token_manager = token_manager
        self.ws = None
        self.conn = None
        self.approval_key = None
        self.subscribed_stocks = set()
        self.connected = False    
        self.connect_event = threading.Event()
    
    def connect_db(self):
        self.conn = get_db_connection(self.conn)
    
    def connect(self):
        if self.ws and self.ws.sock and self.ws.sock.connected:
            logger.info("이미 연결되어 있음")
            return True
        
        self.approval_key = self.token_manager.get_approval_key()
        if not self.approval_key:
            logger.error("Approval Key 발급 실패")
            return False
        
        ws_url = "ws://ops.koreainvestment.com:21000"
        
        self.ws = websocket.WebSocketApp(
            ws_url,
            on_open=self.on_open,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close
        )
        
        
        ws_thread = threading.Thread(
            target=self.ws.run_forever,
            kwargs={
                "ping_interval": 30,
                "ping_timeout": 10 
            })
        ws_thread.daemon = True
        ws_thread.start()
        
        logger.info("WebSocket 연결 시도")

        if not self.connect_event.wait(timeout=5):
            logger.error("WebSocket 접속 실패 (5초 내 on_open 미호출)")
            return False

        return True
    
    def subscribe_stocks(self, stock_codes: List[str]):
        if not self.connected:
            logger.error("WebSocket 연결되지 않음 - 구독 불가")
            return
        
        new_stocks = set(stock_codes) - self.subscribed_stocks
        removed_stocks = self.subscribed_stocks - set(stock_codes)
        
        for stock_code in removed_stocks:
            self._unsubscribe(stock_code)
        
        for stock_code in new_stocks:
            self._subscribe(stock_code)
        
        logger.info(f"구독 업데이트: +{len(new_stocks)}개, -{len(removed_stocks)}개")
    
    def _subscribe(self, stock_code: str):
        subscribe_data = {
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
        
        self.ws.send(json.dumps(subscribe_data))
        self.subscribed_stocks.add(stock_code)
        logger.debug(f"{stock_code} 구독 등록")
    
    def _unsubscribe(self, stock_code: str):
        unsubscribe_data = {
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
        
        self.ws.send(json.dumps(unsubscribe_data))
        self.subscribed_stocks.discard(stock_code)
        logger.debug(f"{stock_code} 구독 해제")
    
    def on_open(self, ws):
        self.connected = True
        self.connect_event.set()  
        logger.info("WebSocket 연결 성공")
    
    def on_message(self, ws, message):
        try:
            data = json.loads(message)
            
            if data.get('header', {}).get('tr_id') == 'H0STCNT0':
                body = data.get('body', {})
                output = body.get('output', {})
                
                stock_code = output.get('MKSC_SHRN_ISCD', '')
                
                current_price = safe_int(output.get('STCK_PRPR', ''))
                if current_price is None:
                    return
                
                volume = safe_int(output.get('ACML_VOL', '')) or 0
                trading_value = safe_int(output.get('ACML_TR_PBMN', '')) or 0 
                change_amount_raw = safe_int(output.get('PRDY_VRSS', '')) or 0
                change_rate = safe_float(output.get('PRDY_CTRT', '')) or 0.0
                
                sign = -1 if output.get('PRDY_VRSS_SIGN') in ('4', '5') else 1
                change_amount = sign * change_amount_raw
                
                stock_dto = StockDTO(
                    stock_code=stock_code,
                    stock_name=output.get('HTS_KOR_ISNM', ''),
                    current_price=current_price,
                    change_amount=change_amount,
                    change_rate=change_rate,
                    volume=volume,
                    trading_value=trading_value 
                )
                
                self.save_to_db(stock_dto)
                
                logger.debug(f"{stock_code}: {current_price:,}원 저장")
                
        except Exception as e:
            logger.error(f"메시지 처리 오류: {e}")
    
    def save_to_db(self, stock: StockDTO):
        try:
            self.connect_db()
            save_stock_price(self.conn, stock)
        except Exception as e:
            logger.error(f"DB 저장 실패 ({stock.stock_code}): {e}")
    
    def on_error(self, ws, error):
        logger.error(f"WebSocket 오류: {error}")
    
    def on_close(self, ws, close_status_code, close_msg):
        self.connected = False  
        logger.info(f"WebSocket 연결 종료: {close_msg}")
        self.subscribed_stocks.clear()
    
    def close(self):
        if self.ws:
            self.ws.close()
        if self.conn:
            self.conn.close()