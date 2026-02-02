import os
import redis
import requests
import threading
from utils.logger import logger
from config.config import REDIS_CONFIG

class TokenManager:
    _instance = None
    _refresh_lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.redis_client = redis.Redis(
            host=REDIS_CONFIG['host'],
            port=REDIS_CONFIG['port'],
            decode_responses=True
        )

        self.stock_api_key = os.getenv("STOCK_API_KEY")
        self.stock_api_secret = os.getenv("STOCK_API_SECRET")
        self.candle_api_key = os.getenv("CANDLE_API_KEY")
        self.candle_api_secret = os.getenv("CANDLE_API_SECRET")
        
        self.stock_token_key = "kis:stock_access_token"
        self.candle_token_key = "kis:candle_access_token"
        self.ws_approval_key = "kis:ws_approval_key"

        self.auth_url = "https://openapi.koreainvestment.com:9443/oauth2/tokenP"
        self.ws_auth_url = "https://openapi.koreainvestment.com:9443/oauth2/Approval"

        self._initialized = True

    #개별 키로 토큰 발급
    def _issue_token(self, api_key: str, api_secret: str) -> str:
        url = "https://openapi.koreainvestment.com:9443/oauth2/tokenP"
        headers = {"content-type": "application/json"}
        body = {
            "grant_type": "client_credentials",
            "appkey": api_key,
            "appsecret": api_secret
        }
        
        try:
            response = requests.post(url, headers=headers, json=body, timeout=10)
            data = response.json()
            
            if "access_token" in data:
                return data["access_token"]
            else:
                logger.error(f"토큰 발급 실패: {data}")
                return None
        except Exception as e:
            logger.error(f"토큰 발급 오류: {e}")
            return None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    #rest 토큰 발급
    def get_stock_token(self) -> str:
        token = self.redis_client.get(self.stock_token_key)
        
        if not token:
            logger.info("STOCK API 토큰 발급")
            token = self._issue_token(self.stock_api_key, self.stock_api_secret)
            
            if token:
                self.redis_client.setex(
                    self.stock_token_key,
                    86400,
                    token
                )
                logger.info("STOCK API 토큰 발급 완료")
        
        return token
    
    def get_candle_token(self) -> str:
        token = self.redis_client.get(self.candle_token_key)
        
        if not token:
            logger.info("CANDLE API 토큰 발급")
            token = self._issue_token(self.candle_api_key, self.candle_api_secret)
            
            if token:
                self.redis_client.setex(
                    self.candle_token_key,
                    86400,
                    token
                )
                logger.info("CANDLE API 토큰 발급 완료")
        
        return token

    def get_token(self) -> str:
        return self.get_stock_token()
    
    #토큰 갱신
    def refresh_token(self, token_type: str = "both"):
        with self._refresh_lock:
            if token_type in ("stock", "both"):
                self.redis_client.delete(self.stock_token_key)
                logger.info("STOCK 토큰 만료 - 재발급 예정")
            
            if token_type in ("candle", "both"):
                self.redis_client.delete(self.candle_token_key)
                logger.info("CANDLE 토큰 만료 - 재발급 예정")
            
            if token_type in ("stock", "both"):
                self.get_stock_token()
            if token_type in ("candle", "both"):
                self.get_candle_token()

    
    #웹소켓 접속키 발급
    def get_approval_key(self):
        try:
            cached_key = self.redis_client.get(self.ws_approval_key)
            
            if cached_key:
                logger.debug("Redis에서 Approval Key 가져오기")
                return cached_key
            
            logger.info("새 Approval Key 발급")
            approval_key = self._issue_new_approval_key()
            
            if approval_key:
                ttl_seconds = 12 * 60 * 60
                self.redis_client.setex(
                    self.ws_approval_key,
                    ttl_seconds,
                    approval_key
                )
                logger.info(f"Approval Key 발급 완료")
                
                return approval_key
            else:
                logger.error("Approval Key 발급 실패")
                return None
                
        except redis.ConnectionError as e:
            logger.error(f"Redis 연결 실패: {e}")
            return None
        except Exception as e:
            logger.error(f"Approval Key 조회 오류: {e}")
            return None

    def _issue_new_approval_key(self):
        try:
            headers = {"content-type": "application/json"}
            body = {
                "grant_type": "client_credentials",
                "appkey": self.stock_api_key,
                "secretkey": self.stock_api_secret
            }

            response = requests.post(
                self.ws_auth_url,
                headers=headers,
                json=body,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('approval_key')
            else:
                logger.error(f"API 응답 오류: {response.status_code}")
                return None
                
        except requests.Timeout:
            logger.error("API 호출 타임아웃")
            return None
        except requests.RequestException as e:
            logger.error(f"API 호출 실패: {e}")
            return None
        except Exception as e:
            logger.error(f"예상치 못한 오류: {e}")
            return None
        
    def close(self):
        if self.redis_client:
            self.redis_client.close()

    def force_close(self):
        if self.redis_client:
            self.redis_client.close()
        TokenManager._instance = None