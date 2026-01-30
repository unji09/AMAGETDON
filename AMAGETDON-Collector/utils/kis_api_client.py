import os
import time
import requests
from typing import List, Optional, Set
from datetime import datetime, timedelta
from core.token_manager import TokenManager
from utils.logger import logger
from utils.market_hours import is_market_open
from models.dto import StockDTO
from utils.helpers import safe_int, safe_float

class KISApiClient:

    def __init__(self, token_manager: TokenManager):
        self.token_manager = token_manager
        self.base_url = "https://openapi.koreainvestment.com:9443"

        self.stock_api_key = os.getenv("STOCK_API_KEY")
        self.stock_api_secret = os.getenv("STOCK_API_SECRET")
        self.candle_api_key = os.getenv("CANDLE_API_KEY")
        self.candle_api_secret = os.getenv("CANDLE_API_SECRET")
    
    def _get_headers(self, tr_id: str, use_candle_api: bool = False) -> dict:
        if use_candle_api:
            token = self.token_manager.get_candle_token()
            api_key = self.candle_api_key
            api_secret = self.candle_api_secret
        else:
            token = self.token_manager.get_stock_token()
            api_key = self.stock_api_key
            api_secret = self.stock_api_secret
        
        return {
            "Content-Type": "application/json; charset=utf-8",
            "authorization": f"Bearer {token}",
            "appkey": api_key,
            "appsecret": api_secret,
            "tr_id": tr_id,
            "custtype": "P"
        }
    
    #일별분봉조회 api
    def fetch_minute_candles_by_date(
        self,
        stock_code: str,
        target_date: str,
        start_time: str = "090000",
        end_time: str = "153000",
        needed_minutes: Optional[Set[datetime]] = None
    ) -> dict:
        
        url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-time-dailychartprice"
        headers = self._get_headers("FHKST03010230", use_candle_api=True)
        
        params = {
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD": stock_code,
            "FID_INPUT_HOUR_1": end_time,
            "FID_INPUT_DATE_1": target_date,
            "FID_PW_DATA_INCU_YN": "Y",  
            "FID_FAKE_TICK_INCU_YN": " "
        }
        
        candles = {}
        current_time = end_time
        max_pages = 50

        for page in range(max_pages):
            params = {
                "FID_COND_MRKT_DIV_CODE": "J",
                "FID_INPUT_ISCD": stock_code,
                "FID_INPUT_HOUR_1": current_time,
                "FID_INPUT_DATE_1": target_date,
                "FID_PW_DATA_INCU_YN": "Y",  
                "FID_FAKE_TICK_INCU_YN": " "
            }
            
            try:
                response = requests.get(url, headers=headers, params=params, timeout=10)
                data = response.json()
                
                if data.get("rt_cd") != "0":
                    logger.error(f"일별분봉 API 오류: {data.get('msg1')}")
                    break
                
                outputs = data.get("output2", [])
                if not outputs:
                    break
                
                oldest_time = None
                for item in outputs:
                    date_str = item.get('stck_bsop_date', '')
                    time_str = item.get('stck_cntg_hour', '')
                    
                    if not date_str or not time_str:
                        continue
                    
                    if date_str != target_date:
                        continue
                    
                    oldest_time = time_str
                    
                    candle_time = datetime.strptime(
                        date_str + time_str[:4] + "00",
                        '%Y%m%d%H%M%S'
                    )
                    
                    if candle_time in candles:
                        continue
                    
                    open_price = int(item.get('stck_oprc', 0))
                    close_price = int(item.get('stck_prpr', 0))
                    
                    if open_price <= 0 or close_price <= 0:
                        continue
                    
                    candles[candle_time] = {
                        'open': open_price,
                        'high': int(item.get('stck_hgpr', 0)),
                        'low': int(item.get('stck_lwpr', 0)),
                        'close': close_price,
                        'volume': int(item.get('cntg_vol', 0))
                    }
                
                # 페이징: start_time에 도달했으면 종료
                if oldest_time:
                    if oldest_time <= start_time:
                        break
                    oldest_dt = datetime.strptime(oldest_time, '%H%M%S')
                    next_time = (oldest_dt - timedelta(minutes=1)).strftime('%H%M%S')
                    current_time = next_time
                    time.sleep(0.1)
                else:
                    break
                    
            except Exception as e:
                logger.error(f"일별분봉 API 호출 실패: {e}")
                break

        return candles
    
    #일봉/주봉 조회
    def fetch_daily_candles(
        self, 
        stock_code: str, 
        start_date: str, 
        end_date: str,
        period_code: str = 'D'
    ) -> List[dict]:
        
        url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice"
        headers = self._get_headers("FHKST03010100", use_candle_api=True)
        
        candles = []
        tr_cont = ""
        max_pages = 10 if period_code == 'D' else 5
        
        for page in range(max_pages):
            params = {
                "FID_COND_MRKT_DIV_CODE": "J",
                "FID_INPUT_ISCD": stock_code,
                "FID_INPUT_DATE_1": start_date,
                "FID_INPUT_DATE_2": end_date,
                "FID_PERIOD_DIV_CODE": period_code,
                "FID_ORG_ADJ_PRC": "0"
            }
            
            if tr_cont:
                headers["tr_cont"] = tr_cont
            
            try:
                response = requests.get(url, headers=headers, params=params, timeout=10)
                data = response.json()
                
                if data.get("rt_cd") != "0":
                    logger.error(f"일봉/주봉 API 오류: {data.get('msg1')}")
                    break
                
                outputs = data.get("output2", [])
                if not outputs:
                    break
                
                for item in outputs:
                    date_str = item.get('stck_bsop_date', '')
                    if not date_str:
                        continue
                    
                    open_price = int(item.get('stck_oprc', 0))
                    close_price = int(item.get('stck_clpr', 0))
                    
                    if open_price == 0 or close_price == 0:
                        continue
                    
                    candles.append({
                        'date': datetime.strptime(date_str, '%Y%m%d'),
                        'open': open_price,
                        'high': int(item.get('stck_hgpr', 0)),
                        'low': int(item.get('stck_lwpr', 0)),
                        'close': close_price,
                        'volume': int(item.get('acml_vol', 0))
                    })
                
                tr_cont = data.get("tr_cont", "")
                if tr_cont not in ("D", "M"):
                    break
                    
            except Exception as e:
                logger.error(f"일봉/주봉 API 호출 실패: {e}")
                break
        
        return candles
    
    #주식기본정보조회 api
    def fetch_stock_basic_info(self, stock_code: str) -> dict:
        url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/search-stock-info"
        headers = self._get_headers("CTPF1002R")
        
        params = {
            "PRDT_TYPE_CD": "300",
            "PDNO": stock_code
        }
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            data = response.json()
            
            if data.get("rt_cd") != "0":
                return None
            
            output = data.get("output", {})
            
            return {
                'stock_code': stock_code,
                'sector_small_code': output.get('std_idst_clsf_cd')
            }
            
        except Exception as e:
            logger.error(f"종목 정보 조회 실패 ({stock_code}): {e}")
            return None
    
    #개별 종목의 현재가 조회
    def fetch_price(self, stock_code: str) -> Optional[StockDTO]:
        if not is_market_open():
            return None

        try:
            url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-price"
            headers = self._get_headers("FHKST01010100")

            params = {
                "FID_COND_MRKT_DIV_CODE": "J",
                "FID_INPUT_ISCD": stock_code
            }

            response = requests.get(url, headers=headers, params=params, timeout=10)
            data = response.json()

            if data.get("rt_cd") != "0":
                return None

            output = data.get("output", {})

            current_price = safe_int(output.get("stck_prpr"))
            if current_price is None:
                return None

            volume = safe_int(output.get("acml_vol")) or 0
            trading_value = safe_int(output.get("acml_tr_pbmn")) or 0
            change_amount = safe_int(output.get("prdy_vrss")) or 0
            change_rate = safe_float(output.get("prdy_ctrt")) or 0.0

            return StockDTO(
                stock_code=stock_code,
                stock_name=output.get("hts_kor_isnm", ""),
                current_price=current_price,
                change_amount=change_amount,
                change_rate=change_rate,
                volume=volume,
                trading_value=trading_value
            )

        except Exception as e:
            logger.error(f"{stock_code} 호출 실패: {e}")
            return None

    #주식현재가 시세
    def fetch_stock_price_info(self, stock_code: str) -> dict:
        url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-price"
        headers = self._get_headers("FHKST01010100")
        
        params = {
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD": stock_code
        }
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            data = response.json()
            
            if data.get("rt_cd") != "0":
                logger.error(f"현재가 시세 API 오류: {data.get('msg1')}")
                return None
            
            output = data.get("output", {})
            
            def safe_float(value):
                try:
                    return float(value) if value and value.strip() else None
                except:
                    return None
            
            def safe_int(value):
                try:
                    return int(value) if value and value.strip() else None
                except:
                    return None
            
            return {
                'stock_code': stock_code,
                'per': safe_float(output.get('per')),           
                'pbr': safe_float(output.get('pbr')),           
                'eps': safe_int(output.get('eps')),             
                'bps': safe_int(output.get('bps')),            
                'market_cap': safe_int(output.get('hts_avls')) 
            }
            
        except Exception as e:
            logger.error(f"현재가 시세 조회 실패 ({stock_code}): {e}")
            return None
        
    #거래량순위
    def fetch_from_api(self) -> List[str]:
        url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/volume-rank"
        
        headers = self._get_headers("FHPST01710000", use_candle_api=True)

        params = {
            "FID_COND_MRKT_DIV_CODE": "J",      
            "FID_COND_SCR_DIV_CODE": "20171",  
            "FID_INPUT_ISCD": "0000",
            "FID_DIV_CLS_CODE": "0",
            "FID_BLNG_CLS_CODE": "0",
            "FID_TRGT_CLS_CODE": "111111111",
            "FID_TRGT_EXLS_CLS_CODE": "0001110111",
            "FID_INPUT_PRICE_1": "",
            "FID_INPUT_PRICE_2": "",
            "FID_VOL_CNT": "",
            "FID_INPUT_DATE_1": ""
        }

        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            data = response.json()
            
            if data.get("rt_cd") == "0":
                outputs = data.get("output", [])
                stock_codes = [item['mksc_shrn_iscd'] for item in outputs]
                logger.info(f"거래량 순위 조회 성공: {len(stock_codes)}개")
                return stock_codes
            else:
                logger.error(f"API 오류: rt_cd={data.get('rt_cd')}, msg1={data.get('msg1')}")
                return []
                
        except Exception as e:
            logger.error(f"API 호출 실패: {e}")
            return []