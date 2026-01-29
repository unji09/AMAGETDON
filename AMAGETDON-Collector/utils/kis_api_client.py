import os
import time
import requests
from typing import List, Optional, Set
from datetime import datetime, timedelta
from core.token_manager import TokenManager
from utils.logger import logger

class KISApiClient:

    def __init__(self, token_manager: TokenManager):
        self.token_manager = token_manager
        self.base_url = "https://openapi.koreainvestment.com:9443"
    
    def _get_headers(self, tr_id: str) -> dict:
        token = self.token_manager.get_token()
        return {
            "Content-Type": "application/json; charset=utf-8",
            "authorization": f"Bearer {token}",
            "appkey": os.getenv("API_KEY"),
            "appsecret": os.getenv("API_SECRET"),
            "tr_id": tr_id,
            "custtype": "P"
        }
    
    #당일분봉조회 api
    def fetch_minute_candles_by_time(
        self, 
        stock_code: str, 
        start_time: str = "090000",
        end_time: str = None,
        needed_minutes: Optional[Set[datetime]] = None
    ) -> dict:
        
        url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice"
        headers = self._get_headers("FHKST03010200")

        today_str = datetime.now().strftime('%Y%m%d')
    
        if end_time is None:
            now = datetime.now()
            if now.hour > 15 or (now.hour == 15 and now.minute >= 30):
                end_time = "153000"
            else:
                end_time = now.strftime('%H%M%S')
        
        candles = {}
        current_time = end_time
        max_pages = 20
        
        for page in range(max_pages):
            if needed_minutes and len(candles) >= len(needed_minutes):
                break
            
            params = {
                "FID_COND_MRKT_DIV_CODE": "J",
                "FID_INPUT_ISCD": stock_code,
                "FID_INPUT_HOUR_1": current_time,
                "FID_PW_DATA_INCU_YN": "Y",
                "FID_FAKE_TICK_INCU_YN": ""
            }
            
            try:
                response = requests.get(url, headers=headers, params=params, timeout=10)
                data = response.json()
                
                if data.get("rt_cd") != "0":
                    logger.error(f"분봉 API 오류: {data.get('msg1')}")
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
                    
                    candle_time = datetime.strptime(
                        date_str + time_str[:4] + "00", 
                        '%Y%m%d%H%M%S'
                    )
                    oldest_time = time_str
                    
                    if needed_minutes and candle_time not in needed_minutes:
                        continue
                    
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
                
                if oldest_time and oldest_time > start_time:
                    oldest_dt = datetime.strptime(oldest_time, '%H%M%S')
                    next_time = (oldest_dt - timedelta(minutes=1)).strftime('%H%M%S')
                    if next_time <= start_time:
                        break
                    current_time = next_time
                    time.sleep(0.1)
                else:
                    break
                    
            except Exception as e:
                logger.error(f"분봉 API 호출 실패: {e}")
                break
        
        return candles
    
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
        headers = self._get_headers("FHKST03010230")
        
        params = {
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD": stock_code,
            "FID_INPUT_HOUR_1": end_time,
            "FID_INPUT_DATE_1": target_date,
            "FID_PW_DATA_INCU_YN": "Y",  
            "FID_FAKE_TICK_INCU_YN": " "
        }
        
        candles = {}
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            data = response.json()
            
            if data.get("rt_cd") != "0":
                logger.error(f"일별분봉 API 오류: {data.get('msg1')}")
                return candles
            
            outputs = data.get("output2", [])
            
            for item in outputs:
                date_str = item.get('stck_bsop_date', '')
                time_str = item.get('stck_cntg_hour', '')
                
                if not date_str or not time_str:
                    continue
                
                if date_str != target_date:
                    continue
                
                candle_time = datetime.strptime(
                    date_str + time_str[:4] + "00",
                    '%Y%m%d%H%M%S'
                )
                
                if needed_minutes and candle_time not in needed_minutes:
                    continue

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
            
        except Exception as e:
            logger.error(f"일별분봉 API 호출 실패: {e}")
        
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
        headers = self._get_headers("FHKST03010100")
        
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