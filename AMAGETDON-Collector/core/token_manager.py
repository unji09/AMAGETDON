import redis
import requests
import os
from core.logger import logger

class TokenManager:
    
    def __init__(self, redis_host='host.docker.internal', redis_port=6379):
        self.appkey = os.getenv('API_KEY')
        self.appsecret = os.getenv('API_SECRET')
        
        self.redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            decode_responses=True
        )
        
        self.token_key = 'kis:access_token'
        self.ws_approval_key = 'kis:ws_approval_key'
        
        self.auth_url = "https://openapi.koreainvestment.com:9443/oauth2/tokenP"
        self.ws_auth_url = "https://openapi.koreainvestment.com:9443/oauth2/Approval"
    
    #rest 토큰 발급
    def get_token(self):
        try:
            cached_token = self.redis_client.get(self.token_key)
            
            if cached_token:
                logger.debug("Redis에서 토큰 가져오기")
                return cached_token
            
            logger.info("새 토큰 발급")
            token = self._issue_new_token()
            
            if token:
                ttl_seconds = 23 * 60 * 60
                self.redis_client.setex(
                    self.token_key,
                    ttl_seconds,
                    token
                )
                logger.info(f"토큰 발급 완료")
                
                return token
            else:
                logger.error("토큰 발급 실패")
                return None
                
        except redis.ConnectionError as e:
            logger.error(f"Redis 연결 실패: {e}")
            return None
        except Exception as e:
            logger.error(f"토큰 조회 오류: {e}")
            return None
    
    def _issue_new_token(self):
        try:
            headers = {"content-type": "application/json"}
            
            body = {
                "grant_type": "client_credentials",
                "appkey": self.appkey,
                "appsecret": self.appsecret
            }
            
            response = requests.post(
                self.auth_url,
                headers=headers,
                json=body,
                timeout=10
            )
            
            if response.status_code != 200:
                logger.error(f"API 응답 오류: {response.status_code}")
                return None
            
            data = response.json()
            
            if 'access_token' in data:
                token = data['access_token']
                return token
            else:
                logger.error(f"API 응답 오류: {data}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"API 호출 실패: {e}")
            return None
        except Exception as e:
            logger.error(f"토큰 발급 오류: {e}")
            return None
    
    def refresh_token(self):
        logger.info("토큰 갱신")
        
        self.redis_client.delete(self.token_key)
        
        return self.get_token()
    
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
                "appkey": self.appkey,
                "secretkey": self.appsecret
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