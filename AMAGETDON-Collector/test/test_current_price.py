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
from utils.helpers import safe_int, safe_float
from models.dto import StockDTO


async def fetch_price(session, api_client, stock_code):
    """현재가 단일 종목 조회"""
    url = f"{api_client.base_url}/uapi/domestic-stock/v1/quotations/inquire-price"
    headers = api_client._get_headers("FHKST01010100")
    params = {
        "FID_COND_MRKT_DIV_CODE": "J",
        "FID_INPUT_ISCD": stock_code
    }

    try:
        async with session.get(url, headers=headers, params=params) as response:
            data = await response.json()

            if data.get("rt_cd") != "0":
                print(f"  [DEBUG] {stock_code}: rt_cd={data.get('rt_cd')}, msg={data.get('msg1')}")
                return stock_code, None

            output = data.get("output", {})
            if not output:
                return stock_code, None

            current_price = safe_int(output.get("stck_prpr"))
            if current_price is None:
                return stock_code, None

            return stock_code, StockDTO(
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
        print(f"  [DEBUG] {stock_code}: exception={e}")
        return stock_code, None


async def test_current_price(stock_count: int = 100):
    """현재가 시세 조회 테스트 (병렬)"""

    print("=" * 60)
    print("현재가 시세 조회 테스트 (병렬)")
    print("=" * 60)

    # DB에서 종목 가져오기
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute(f"SELECT stock_code FROM stock LIMIT {stock_count}")
    stocks = [row[0] for row in cursor.fetchall()]
    conn.close()

    print(f"테스트 대상: {len(stocks)}개 종목")
    print("-" * 60)

    token_manager = TokenManager.get_instance()
    api_client = KISApiClient(token_manager)

    # 초당 요청 수 (STOCK API 제한: 20건)
    BATCH_SIZE = 19

    start_time = datetime.now()
    success_count = 0
    fail_count = 0
    all_results = []

    try:
        connector = aiohttp.TCPConnector(limit=20)
        timeout = aiohttp.ClientTimeout(total=30)
        session = aiohttp.ClientSession(connector=connector, timeout=timeout)

        # 배치 단위로 처리
        for i in range(0, len(stocks), BATCH_SIZE):
            batch_start = time.time()
            batch = stocks[i:i + BATCH_SIZE]

            tasks = [fetch_price(session, api_client, code) for code in batch]
            results = await asyncio.gather(*tasks)
            all_results.extend(results)

            # 1초 대기 보장
            elapsed = time.time() - batch_start
            if elapsed < 1.0 and i + BATCH_SIZE < len(stocks):
                await asyncio.sleep(1.0 - elapsed)

            print(f"  배치 {i // BATCH_SIZE + 1}/{(len(stocks) + BATCH_SIZE - 1) // BATCH_SIZE} 완료")

        for stock_code, dto in all_results:
            if dto:
                print(f"✓ {stock_code} ({dto.stock_name}): {dto.current_price:,}원 ({dto.change_rate:+.2f}%)")
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

    elapsed = (datetime.now() - start_time).total_seconds()

    print("-" * 60)
    print(f"테스트 완료")
    print(f"  - 성공: {success_count}개")
    print(f"  - 실패: {fail_count}개")
    print(f"  - 소요시간: {elapsed:.2f}초")
    print(f"  - 평균: {elapsed/len(stocks):.3f}초/종목")
    print("=" * 60)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='현재가 시세 조회 테스트')
    parser.add_argument('--count', '-c', type=int, default=100,
                        help='테스트할 종목 수 (기본: 100)')

    args = parser.parse_args()
    asyncio.run(test_current_price(args.count))
