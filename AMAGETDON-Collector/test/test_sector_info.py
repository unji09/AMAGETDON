import os
import sys
import asyncio
import pymysql
import time
import aiohttp
from datetime import datetime

# 프로젝트 루트를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.token_manager import TokenManager
from utils.kis_api_client import KISApiClient
from config.config import DB_CONFIG


async def fetch_single(session, api_client, stock_code):
    """단일 종목 조회"""
    url = f"{api_client.base_url}/uapi/domestic-stock/v1/quotations/search-stock-info"
    headers = api_client._get_headers("CTPF1002R")
    params = {
        "PRDT_TYPE_CD": "300",
        "PDNO": stock_code
    }

    try:
        async with session.get(url, headers=headers, params=params) as response:
            data = await response.json()

            if data.get("rt_cd") != "0":
                print(f"  [DEBUG] {stock_code}: rt_cd={data.get('rt_cd')}, msg={data.get('msg1')}")
                return stock_code, None

            output = data.get("output", {})
            return stock_code, {
                'stock_code': stock_code,
                'sector_small_code': output.get('std_idst_clsf_cd')
            }
    except Exception as e:
        print(f"  [DEBUG] {stock_code}: exception={e}")
        return stock_code, None


async def test_stock_basic_info_fast():
    """업종정보조회 API 테스트 - 배치 병렬 처리"""

    print("=" * 60)
    print("업종정보조회 API 테스트 (배치 병렬 처리)")
    print("=" * 60)

    # DB에서 100개 종목 가져오기
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute("SELECT stock_code FROM stock LIMIT 100")
    stocks = [row[0] for row in cursor.fetchall()]
    conn.close()

    print(f"테스트 대상: {len(stocks)}개 종목")
    print("-" * 60)

    token_manager = TokenManager.get_instance()
    api_client = KISApiClient(token_manager)

    # 초당 요청 수 (API 제한에 맞게 조절)
    BATCH_SIZE = 19

    start_time = datetime.now()
    success_count = 0
    fail_count = 0
    all_results = []

    try:
        # 동시 연결 20개 허용하는 세션 생성
        connector = aiohttp.TCPConnector(limit=20)
        timeout = aiohttp.ClientTimeout(total=30)
        session = aiohttp.ClientSession(connector=connector, timeout=timeout)

        # 배치 단위로 처리
        for i in range(0, len(stocks), BATCH_SIZE):
            batch_start = time.time()
            batch = stocks[i:i + BATCH_SIZE]

            # 배치 내 요청은 병렬로 실행
            tasks = [fetch_single(session, api_client, code) for code in batch]
            results = await asyncio.gather(*tasks)
            all_results.extend(results)

            # 1초가 안 지났으면 대기
            elapsed = time.time() - batch_start
            if elapsed < 1.0 and i + BATCH_SIZE < len(stocks):
                await asyncio.sleep(1.0 - elapsed)

            print(f"  배치 {i // BATCH_SIZE + 1}/{(len(stocks) + BATCH_SIZE - 1) // BATCH_SIZE} 완료")

        for stock_code, info in all_results:
            if info:
                print(f"✓ {stock_code}: 업종코드={info.get('sector_small_code', 'N/A')}")
                success_count += 1
            else:
                print(f"✗ {stock_code}: 조회 실패")
                fail_count += 1

    except Exception as e:
        print(f"에러 발생: {e}")
    finally:
        await session.close()
        await api_client.close()
        token_manager.close()

    end_time = datetime.now()
    elapsed = (end_time - start_time).total_seconds()

    print("-" * 60)
    print(f"테스트 완료")
    print(f"  - 성공: {success_count}개")
    print(f"  - 실패: {fail_count}개")
    print(f"  - 소요시간: {elapsed:.2f}초")
    print(f"  - 평균: {elapsed/len(stocks):.3f}초/종목")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_stock_basic_info_fast())
