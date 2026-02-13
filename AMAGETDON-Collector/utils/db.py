from typing import List, Optional
import pymysql
from datetime import datetime, timedelta
from config.config import DB_CONFIG
from models.dto import StockDTO, CandleDTO

def get_db_connection(conn):
    if conn is None or not conn.open:
        return pymysql.connect(**DB_CONFIG)
    return conn

def save_stock_price(conn, stock: StockDTO):
    cursor = conn.cursor()
    sql = """
        INSERT INTO stock_prices
        (stock_code, current_price, volume, trading_value, change_amount, change_rate, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(sql, (
        stock.stock_code,
        stock.current_price,
        stock.volume,
        stock.trading_value,
        stock.change_amount,
        stock.change_rate,
        datetime.now()
    ))
    conn.commit()

def save_candle(conn, candle: CandleDTO, auto_commit: bool = True):
    cursor = conn.cursor()
    
    query = """
    INSERT INTO chart_candles 
    (stock_code, interval_type, candle_time, open_price, high_price, low_price, close_price, volume, created_at) 
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
    ON DUPLICATE KEY UPDATE
        open_price = VALUES(open_price),
        high_price = VALUES(high_price),
        low_price = VALUES(low_price),
        close_price = VALUES(close_price),
        volume = VALUES(volume),
        created_at = NOW()
    """
    
    cursor.execute(query, (
        candle.stock_code,
        candle.interval_type,
        candle.candle_time,
        candle.open_price,
        candle.high_price,
        candle.low_price,
        candle.close_price,
        candle.volume
    ))
    
    if auto_commit:
        conn.commit()

def save_candles(conn, candles: List[CandleDTO]):
    cursor = conn.cursor()
    
    query = """
    INSERT INTO chart_candles 
    (stock_code, interval_type, candle_time, open_price, high_price, low_price, close_price, volume, created_at) 
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
    ON DUPLICATE KEY UPDATE
        open_price = VALUES(open_price),
        high_price = VALUES(high_price),
        low_price = VALUES(low_price),
        close_price = VALUES(close_price),
        volume = VALUES(volume),
        created_at = NOW()
    """
    
    data = [
        (c.stock_code, c.interval_type, c.candle_time,
         c.open_price, c.high_price, c.low_price, c.close_price, c.volume)
        for c in candles
    ]
    
    cursor.executemany(query, data)
    conn.commit()

#거래 정지 종목 삭제
def delete_stock(conn, stock_code: str):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM stock WHERE stock_code = %s", (stock_code,))
    conn.commit()

def delete_stocks(conn, stock_codes: List[str]):
    if not stock_codes:
        return
    cursor = conn.cursor()
    placeholders = ','.join(['%s'] * len(stock_codes))
    cursor.execute(f"DELETE FROM stock WHERE stock_code IN ({placeholders})", stock_codes)
    conn.commit()

# stock_prices 전체 삭제 + 캔들 보관 기간 초과분 삭제
def cleanup_old_data(conn) -> dict:
    cursor = conn.cursor()

    cursor.execute("DELETE FROM stock_prices")
    result = {'stock_prices': cursor.rowcount}

    retention = {'1m': 1, '5m': 1, '30m': 7, '1d': 90, '1w': 365}
    for interval_type, days in retention.items():
        cutoff = datetime.now() - timedelta(days=days)
        cursor.execute(
            "DELETE FROM chart_candles WHERE interval_type = %s AND candle_time < %s",
            (interval_type, cutoff)
        )
        result[interval_type] = cursor.rowcount

    conn.commit()
    return result

# 해당 종목의 가장 최근 캔들 조회
def get_latest_candle(conn, stock_code: str, interval_type: str) -> Optional[dict]:
    cursor = conn.cursor()
    query = """
    SELECT candle_time, open_price, high_price, low_price, close_price, volume
    FROM chart_candles
    WHERE stock_code = %s AND interval_type = %s
    ORDER BY candle_time DESC
    LIMIT 1
    """
    cursor.execute(query, (stock_code, interval_type))
    result = cursor.fetchone()

    if result:
        return {
            'candle_time': result[0],
            'open_price': result[1],
            'high_price': result[2],
            'low_price': result[3],
            'close_price': result[4],
            'volume': result[5]
        }
    return None
