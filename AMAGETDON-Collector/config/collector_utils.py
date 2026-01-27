import os
import requests
from logger import logger

def get_top_30_volume_stocks(self):
    token = self.token_manager.get_token()
    url = "https://openapi.koreainvestment.com/uapi/domestic-stock/v1/quotations/volume-rank"
    
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "authorization": f"Bearer {token}",
        "appkey": os.getenv("API_KEY"),
        "appsecret": os.getenv("API_SECRET"),
        "tr_id": "FHPST01710000",
        "custtype": "P"
    }

    params = {
        "FID_COND_MRKT_DIV_CODE": "J", 
        "FID_COND_SCR_DIV_CODE": "20171",
        "FID_INPUT_ISCD": "0000",
        "FID_DIV_CLS_CODE": "0",
        "FID_BLNG_CLS_CODE": "0",
        "FID_TRGT_CLS_CODE": "111111111",
        "FID_TRGT_EXLS_CLS_CODE": "111111000",
        "FID_INPUT_PRICE_1": "",
        "FID_INPUT_PRICE_2": "",
        "FID_VOL_CNT": "",
        "FID_INPUT_DATE_1": ""
    }

    response = requests.get(url, headers=headers, params=params)
    data = response.json()
    
    if data.get("rt_cd") == "0":
        top_30 = [item['mksc_shrn_iscd'] for item in data.get("output", [])[:30]]
        logger.info(f"거래량 상위 30개 종목 추출 완료: {top_30}")
        return top_30
    else:
        logger.error(f"거래량 순위 조회 실패: {data.get('msg1')}")
        return []