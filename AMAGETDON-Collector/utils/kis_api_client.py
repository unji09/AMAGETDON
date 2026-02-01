import os
import time
import requests
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor
from typing import List, Optional, Set
from datetime import datetime, timedelta
from core.token_manager import TokenManager
from utils.logger import logger
from models.dto import StockDTO
from utils.helpers import safe_int, safe_float
from utils.rate_limiter import (
    STOCK_API_LIMITER, CANDLE_API_LIMITER,
    STOCK_API_SYNC_LIMITER, CANDLE_API_SYNC_LIMITER
)

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
    
    async def fetch_minute_candles_by_date_async(
        self,
        session: aiohttp.ClientSession,
        stock_code: str,
        target_date: str,
        start_time: str = "090000",
        end_time: str = "153000",
        needed_minutes: Optional[Set[datetime]] = None
    ) -> dict:
        
        url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-time-dailychartprice"
        
        candles = {}
        current_time = end_time
        max_pages = 50

        for page in range(max_pages):
            await CANDLE_API_LIMITER.acquire()  # rate limiter 적용
            
            headers = self._get_headers("FHKST03010230", use_candle_api=True)
            params = {
                "FID_COND_MRKT_DIV_CODE": "J",
                "FID_INPUT_ISCD": stock_code,
                "FID_INPUT_HOUR_1": current_time,
                "FID_INPUT_DATE_1": target_date,
                "FID_PW_DATA_INCU_YN": "Y",  
                "FID_FAKE_TICK_INCU_YN": " "
            }
            
            try:
                async with session.get(
                    url, 
                    headers=headers, 
                    params=params, 
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    data = await response.json()
                
                # 토큰 만료 시 갱신 후 재시도
                if data.get("rt_cd") != "0" and "token" in data.get("msg1", "").lower():
                    self.token_manager.refresh_token()
                    headers = self._get_headers("FHKST03010230", use_candle_api=True)
                    async with session.get(
                        url, 
                        headers=headers, 
                        params=params,
                        timeout=aiohttp.ClientTimeout(total=10)
                    ) as retry_response:
                        data = await retry_response.json()
                
                if data.get("rt_cd") != "0":
                    logger.error(f"일별분봉 API 오류: {data.get('msg1')}")
                    break
                
                outputs = data.get("output2", [])
                if not outputs:
                    break
                
                # 기존 로직과 동일하게 candle 데이터 처리
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
                
                if oldest_time:
                    if oldest_time <= start_time:
                        break
                    oldest_dt = datetime.strptime(oldest_time, '%H%M%S')
                    next_time = (oldest_dt - timedelta(minutes=1)).strftime('%H%M%S')
                    current_time = next_time
                    await asyncio.sleep(0.1)  # time.sleep 대신 asyncio.sleep
                else:
                    break
                    
            except Exception as e:
                logger.error(f"일별분봉 API 호출 실패: {e}")
                break

        return candles

    async def fetch_minute_candles_batch(
        self, 
        requests: List[tuple],  # [(stock_code, target_date), ...]
        batch_size: int = 5
    ) -> dict:
        results = {}
        
        async with aiohttp.ClientSession() as session:
            tasks = [
                self.fetch_minute_candles_by_date_async(session, code, date)
                for code, date in requests
            ]
            all_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for (code, date), result in zip(requests, all_results):
                if isinstance(result, dict) and result:
                    results[(code, date)] = result
        
        return results


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
                data = self._request_with_retry(url, headers, params, "FHKST03010230", use_candle_api=True)
                
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
    
    #비동기 일봉/주봉 조회
    async def fetch_daily_candles_async(
        self,
        session: aiohttp.ClientSession,
        stock_code: str, 
        start_date: str, 
        end_date: str,
        period_code: str = 'D'
    ) -> List[dict]:
        await CANDLE_API_LIMITER.acquire()
        
        url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice"
        headers = self._get_headers("FHKST03010100", use_candle_api=True)
        
        candles = []
        tr_cont = ""
        max_pages = 10 if period_code == 'D' else 5
        
        for page in range(max_pages):
            if page > 0:
                await CANDLE_API_LIMITER.acquire()
            
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
                async with session.get(
                    url, 
                    headers=headers, 
                    params=params, 
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    data = await response.json()
                
                # 토큰 만료 시 갱신 후 재시도
                if data.get("rt_cd") != "0" and "token" in data.get("msg1", "").lower():
                    self.token_manager.refresh_token()
                    headers = self._get_headers("FHKST03010100", use_candle_api=True)
                    async with session.get(
                        url, 
                        headers=headers, 
                        params=params,
                        timeout=aiohttp.ClientTimeout(total=10)
                    ) as retry_response:
                        data = await retry_response.json()
                
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

    #일봉/주봉 배치 조회
    async def fetch_daily_candles_batch(
        self, 
        requests: List[tuple],  # [(stock_code, start_date, end_date, period_code), ...]
        max_concurrent: int = 5
    ) -> dict:
        results = {}
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def fetch_with_limit(session, stock_code, start_date, end_date, period_code):
            async with semaphore:
                return await self.fetch_daily_candles_async(
                    session, stock_code, start_date, end_date, period_code
                )
        
        async with aiohttp.ClientSession() as session:
            tasks = [
                fetch_with_limit(session, code, start, end, period)
                for code, start, end, period in requests
            ]
            all_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for (code, start, end, period), result in zip(requests, all_results):
                if isinstance(result, list) and result:
                    results[code] = result
        
        return results


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
                data = self._request_with_retry(url, headers, params, "FHKST03010100", use_candle_api=True)
                
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
            data = self._request_with_retry(url, headers, params, "CTPF1002R")
            
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
        
    #비동기 종목기본정보조회 api
    async def fetch_stock_basic_info_async(self, session: aiohttp.ClientSession, stock_code: str) -> dict:
        await STOCK_API_LIMITER.acquire()

        url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/search-stock-info"
        headers = self._get_headers("CTPF1002R")
        params = {
            "PRDT_TYPE_CD": "300",
            "PDNO": stock_code
        }
        
        try:
            async with session.get(url, headers=headers, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                data = await response.json()
                
                if data.get("rt_cd") != "0" and "token" in data.get("msg1", "").lower():
                    self.token_manager.refresh_token()
                    headers = self._get_headers("CTPF1002R")
                    async with session.get(url, headers=headers, params=params, timeout=aiohttp.ClientTimeout(total=10)) as retry_response:
                        data = await retry_response.json()
                
                if data.get("rt_cd") != "0":
                    logger.error(f"종목 정보 조회 실패 ({stock_code}): rt_cd={data.get('rt_cd')}, msg={data.get('msg1')}")
                    return None
                
                output = data.get("output", {})
                return {
                    'stock_code': stock_code,
                    'sector_small_code': output.get('std_idst_clsf_cd')
                }
        except Exception as e:
            logger.error(f"종목 정보 조회 실패 ({stock_code}): {e}")
            return None

    #종목기본정보 배치 조회
    async def fetch_stock_basic_info_batch(self, stock_codes: list, batch_size: int = 20) -> dict:
        results = {}
        
        async with aiohttp.ClientSession() as session:
            tasks = [self.fetch_stock_basic_info_async(session, code) for code in stock_codes]
            all_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for code, result in zip(stock_codes, all_results):
                if isinstance(result, dict) and result:
                    results[code] = result
        
        return results
    
    #현재가시세조회
    def fetch_price(self, stock_code: str) -> Optional[StockDTO]:
        try:
            url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-price"
            headers = self._get_headers("FHKST01010100")

            params = {
                "FID_COND_MRKT_DIV_CODE": "J",
                "FID_INPUT_ISCD": stock_code
            }

            data = self._request_with_retry(url, headers, params, "FHKST01010100")

            if data.get("rt_cd") != "0":
                return None

            output = data.get("output", {})

            if not output:
                return None
            
            current_price = safe_int(output.get("stck_prpr"))
            if current_price is None:
                return None

            return StockDTO(
                stock_code=stock_code,
                stock_name=output.get("hts_kor_isnm", ""),
                current_price=current_price,
                change_amount=safe_int(output.get("prdy_vrss")) or 0,
                change_rate=safe_float(output.get("prdy_ctrt")) or 0.0,
                volume=safe_int(output.get("acml_vol")) or 0,
                trading_value=safe_int(output.get("acml_tr_pbmn")) or 0,
                per=safe_float(output.get("per")),
                pbr=safe_float(output.get("pbr")),
                eps=safe_int(output.get("eps")),
                bps=safe_int(output.get("bps")),
                market_cap=safe_int(output.get("hts_avls"))
            )

        except Exception as e:
            logger.error(f"{stock_code} 호출 실패: {e}")
            return None
        
    #비동기 현재가 조회
    async def fetch_price_async(self, session: aiohttp.ClientSession, stock_code: str) -> Optional[StockDTO]:
        await STOCK_API_LIMITER.acquire()

        try:
            url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-price"
            headers = self._get_headers("FHKST01010100")
            params = {
                "FID_COND_MRKT_DIV_CODE": "J",
                "FID_INPUT_ISCD": stock_code
            }
            
            async with session.get(url, headers=headers, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                data = await response.json()

                if data.get("rt_cd") != "0" and "token" in data.get("msg1", "").lower():
                    logger.info("토큰 만료 - 갱신 후 재시도")
                    self.token_manager.refresh_token()
                    headers = self._get_headers("FHKST01010100")
                    
                    async with session.get(url, headers=headers, params=params, timeout=aiohttp.ClientTimeout(total=10)) as retry_response:
                        data = await retry_response.json()
                
                if data.get("rt_cd") != "0":
                    return None
                
                output = data.get("output", {})
                if not output:
                    return None
                
                current_price = safe_int(output.get("stck_prpr"))
                if current_price is None:
                    return None
                
                return StockDTO(
                    stock_code=stock_code,
                    stock_name=output.get("hts_kor_isnm", ""),
                    current_price=current_price,
                    change_amount=safe_int(output.get("prdy_vrss")) or 0,
                    change_rate=safe_float(output.get("prdy_ctrt")) or 0.0,
                    volume=safe_int(output.get("acml_vol")) or 0,
                    trading_value=safe_int(output.get("acml_tr_pbmn")) or 0,
                    per=safe_float(output.get("per")),
                    pbr=safe_float(output.get("pbr")),
                    eps=safe_int(output.get("eps")),
                    bps=safe_int(output.get("bps")),
                    market_cap=safe_int(output.get("hts_avls"))
                )
        except Exception as e:
            logger.error(f"{stock_code} 비동기 호출 실패: {e}")
            return None

    #현재가시세 배치 처리
    async def fetch_prices_batch(self, stock_codes: list, batch_size: int = 20) -> dict:
        results = {}
    
        async with aiohttp.ClientSession() as session:
            tasks = [self.fetch_price_async(session, code) for code in stock_codes]
            all_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for code, result in zip(stock_codes, all_results):
                if isinstance(result, StockDTO):
                    results[code] = result
        
        return results
        
    #거래량순위
    def fetch_from_api(self) -> List[str]:
        CANDLE_API_SYNC_LIMITER.acquire()
        
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
            data = self._request_with_retry(url, headers, params, "FHPST01710000", use_candle_api=True)
            
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
        
    #토큰 갱신
    def _request_with_retry(self, url, headers, params, tr_id, use_candle_api=False):
        response = requests.get(url, headers=headers, params=params, timeout=10)
        data = response.json()
        
        if data.get("rt_cd") != "0" and "token" in data.get("msg1", "").lower():
            logger.info("토큰 만료 - 갱신 후 재시도")
            self.token_manager.refresh_token()
            headers = self._get_headers(tr_id, use_candle_api)
            response = requests.get(url, headers=headers, params=params, timeout=10)
            data = response.json()
        
        return data