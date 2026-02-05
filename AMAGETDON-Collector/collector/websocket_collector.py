import json
import websocket
import threading
from typing import List, Dict
from datetime import datetime, timedelta
from collections import defaultdict
from core.token_manager import TokenManager
from models.dto import StockDTO, CandleDTO
from utils.logger import logger
from utils.helpers import safe_int, safe_float
from utils.db import get_db_connection, save_stock_price, save_candle

class WebSocketCollector:

    def __init__(self, token_manager: TokenManager): 
        self.token_manager = token_manager
        self.ws = None
        self.approval_key = None
        self.subscribed_stocks = set()
        self.connected = False    
        self.connect_event = threading.Event()
        self.current_minute: Dict[str, list] = defaultdict(list)
        self.last_completed: Dict[str, datetime] = {}
        self.conn = None
    
    def connect_db(self):
        self.conn = get_db_connection(self.conn)

    #웹소켓 연결
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
    
    #구독 업데이트
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
    
    #구독 등록
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
    
    #구독 해제
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
    
    #데이터 파싱
    def on_message(self, ws, message):
        try:
            parts = message.split('|')
            if len(parts) < 4:
                # 구독 응답 로깅
                logger.info(f"WS 응답: {message[:200]}")

                # 에러 체크
                if "ALREADY IN USE" in message:
                    logger.error("appkey 중복 사용 - 다른 연결이 이미 존재합니다. 기존 프로세스를 종료하세요.")
                    return
                if "invalid approval" in message.lower() or "NOT FOUND" in message:
                    logger.warning("Approval Key 만료 - 재발급 후 재연결")
                    self._reconnect_with_new_key()
                return

            tr_id = parts[1]
            if tr_id != 'H0STCNT0':
                return

            fields = parts[3].split('^')

            stock_code = fields[0]
            current_price = safe_int(fields[2])
            change_amount = safe_int(fields[4])
            change_rate = safe_float(fields[5])
            volume = safe_int(fields[13])  # ACML_VOL (누적 거래량)
            trading_value = safe_int(fields[14])  # ACML_TR_PBMN (누적 거래대금)

            if current_price is None:
                return

            stock_dto = StockDTO(
                stock_code=stock_code,
                stock_name='',
                current_price=current_price,
                change_amount=change_amount,
                change_rate=change_rate,
                volume=volume,
                trading_value=trading_value
            )
            self.save_stock_to_db(stock_dto)
            
            tick_data = {
                'time': datetime.now(),
                'price': current_price,
                'volume': volume
            }
            self.on_tick(stock_code, tick_data)

            logger.info(f"WS 체결: {stock_code} {current_price:,}원 ({change_rate:+.2f}%)")

        except Exception as e:
            logger.error(f"메시지 처리 오류: {e}")
    
    def save_stock_to_db(self, stock: StockDTO):
        try:
            self.connect_db()
            save_stock_price(self.conn, stock)
        except Exception as e:
            logger.error(f"DB 저장 실패 ({stock.stock_code}): {e}")
    
    def on_error(self, ws, error):
        logger.error(f"WebSocket 오류: {error}")
    
    def on_close(self, ws, close_status_code, close_msg):
        self.connected = False
        self.connect_event.clear()
        logger.info(f"WebSocket 연결 종료: code={close_status_code}, msg={close_msg}")
        # 자동 재연결 안 함 - 외부에서 필요 시 reconnect() 호출
    
    #웹소켓 체결 데이터 처리
    def on_tick(self, stock_code: str, tick_data: dict):
        try:
            tick_time = tick_data['time']
            minute_time = tick_time.replace(second=0, microsecond=0)
            
            self.current_minute[stock_code].append({
                'time': tick_time,
                'price': tick_data['price'],
                'volume': tick_data['volume']
            })
            
            self._check_minute_complete(stock_code, minute_time)
            
        except Exception as e:
            logger.error(f"체결 데이터 처리 실패: {e}")
    
    #분이 바뀌었는지 확인 후 1분봉 생성
    def _check_minute_complete(self, stock_code: str, current_minute: datetime):
        ticks = self.current_minute[stock_code]
        if not ticks:
            return
        
        oldest_minute = ticks[0]['time'].replace(second=0, microsecond=0)
        
        if current_minute > oldest_minute:
            self._create_and_save_minute_candle(stock_code, oldest_minute, ticks)

            self.current_minute[stock_code] = [
                t for t in ticks 
                if t['time'].replace(second=0, microsecond=0) == current_minute
            ]
    
    #1분봉 생성/저장
    def _create_and_save_minute_candle(self, stock_code: str, minute_time: datetime, ticks: list):
        if not ticks:
            return
        
        try:
            ticks.sort(key=lambda x: x['time'])
            
            candle_1m = CandleDTO(
                stock_code=stock_code,
                interval_type='1m',
                candle_time=minute_time,
                open_price=ticks[0]['price'],
                high_price=max(t['price'] for t in ticks),
                low_price=min(t['price'] for t in ticks),
                close_price=ticks[-1]['price'],
                volume=sum(t['volume'] for t in ticks)
            )
            
            save_candle(self.conn, candle_1m, auto_commit=True)
            logger.debug(f"{stock_code} 1분봉 생성: {minute_time}")
            
            self.last_completed[stock_code] = minute_time
            
            self._try_create_aggregated_candles(stock_code, minute_time)
            
        except Exception as e:
            logger.error(f"1분봉 생성 실패: {e}")
    
    #5분/30분봉 생성 시점 확인
    def _try_create_aggregated_candles(self, stock_code: str, minute_time: datetime):
        if minute_time.minute % 5 == 4:
            aligned_time = minute_time.replace(minute=(minute_time.minute // 5) * 5)
            self._create_5min_candle_from_db(stock_code, aligned_time)
        
        if minute_time.minute % 30 == 29:
            aligned_time = minute_time.replace(minute=(minute_time.minute // 30) * 30)
            self._create_30min_candle_from_db(stock_code, aligned_time)
    
    #DB에 있는 1분봉으로만 5분봉 생성
    def _create_5min_candle_from_db(self, stock_code: str, start_time: datetime):
        try:
            self.connect_db()
            cursor = self.conn.cursor()
            end_time = start_time + timedelta(minutes=4, seconds=59)
            
            query = """
            SELECT candle_time, open_price, high_price, low_price, close_price, volume
            FROM chart_candles
            WHERE stock_code = %s AND interval_type = '1m'
            AND candle_time >= %s AND candle_time <= %s
            ORDER BY candle_time ASC
            """
            cursor.execute(query, (stock_code, start_time, end_time))
            rows = cursor.fetchall()
            
            if len(rows) >= 1:
                candle_5m = CandleDTO(
                    stock_code=stock_code,
                    interval_type='5m',
                    candle_time=start_time,
                    open_price=rows[0][1],
                    high_price=max(row[2] for row in rows),
                    low_price=min(row[3] for row in rows),
                    close_price=rows[-1][4],
                    volume=sum(row[5] for row in rows)
                )
                save_candle(self.conn, candle_5m, auto_commit=True)
                logger.info(f"{stock_code} 5분봉 생성: {start_time} (1분봉 {len(rows)}개)")
            else:
                logger.debug(f"{stock_code} 5분봉 스킵: {start_time} (1분봉 없음)")
                
        except Exception as e:
            logger.error(f"5분봉 생성 실패: {e}")

    #DB에 있는 5분봉으로 30분봉 생성 (1개 이상이면 생성)
    def _create_30min_candle_from_db(self, stock_code: str, start_time: datetime):
        try:
            self.connect_db()
            cursor = self.conn.cursor()

            end_time = start_time + timedelta(minutes=29, seconds=59)

            query = """
            SELECT candle_time, open_price, high_price, low_price, close_price, volume
            FROM chart_candles
            WHERE stock_code = %s
            AND interval_type = '5m'
            AND candle_time >= %s
            AND candle_time <= %s
            ORDER BY candle_time ASC
            """

            cursor.execute(query, (stock_code, start_time, end_time))
            rows = cursor.fetchall()

            if len(rows) >= 1:  # 1개 이상이면 생성
                candle_30m = CandleDTO(
                    stock_code=stock_code,
                    interval_type='30m',
                    candle_time=start_time,
                    open_price=rows[0][1],
                    high_price=max(row[2] for row in rows),
                    low_price=min(row[3] for row in rows),
                    close_price=rows[-1][4],
                    volume=sum(row[5] for row in rows)
                )

                save_candle(self.conn, candle_30m, auto_commit=True)
                logger.info(f"{stock_code} 30분봉 생성: {start_time} (5분봉 {len(rows)}개)")
            else:
                logger.debug(f"{stock_code} 30분봉 스킵: {start_time} (5분봉 없음)")

        except Exception as e:
            logger.error(f"30분봉 생성 실패: {e}")
    
    def _reconnect_with_new_key(self):
        """Approval Key 재발급 후 재연결"""
        try:
            # 기존 연결 종료
            if self.ws:
                self.ws.close()

            # Redis에서 기존 키 삭제
            self.token_manager.redis_client.delete(self.token_manager.ws_approval_key)

            # 상태 초기화
            self.connected = False
            self.connect_event.clear()
            self.subscribed_stocks.clear()

            # 재연결
            logger.info("새 Approval Key로 재연결 시도")
            self.connect()

            # 기존 구독 종목이 있으면 다시 구독 (main에서 처리)
        except Exception as e:
            logger.error(f"재연결 실패: {e}")

    def close(self):
        if self.ws:
            self.ws.close()
        if self.conn:
            self.conn.close()