from typing import List, Optional
import pymysql
from datetime import datetime
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

def delete_stock(conn, stock_code: str):
    """거래 정지 종목 삭제"""
    cursor = conn.cursor()
    cursor.execute("DELETE FROM stock WHERE stock_code = %s", (stock_code,))
    conn.commit()

def delete_stocks(conn, stock_codes: List[str]):
    """거래 정지 종목 일괄 삭제"""
    if not stock_codes:
        return
    cursor = conn.cursor()
    placeholders = ','.join(['%s'] * len(stock_codes))
    cursor.execute(f"DELETE FROM stock WHERE stock_code IN ({placeholders})", stock_codes)
    conn.commit()

def build_fallback_candle(conn, stock_code: str, interval_type: str, candle_time: datetime) -> Optional[CandleDTO]:
    """데이터 없을 때 가장 최근 캔들의 종가로 대체 캔들 생성 (저장하지 않음)"""
    latest = get_latest_candle(conn, stock_code, interval_type)
    if latest:
        return CandleDTO(
            stock_code=stock_code,
            interval_type=interval_type,
            candle_time=candle_time,
            open_price=latest['close_price'],
            high_price=latest['close_price'],
            low_price=latest['close_price'],
            close_price=latest['close_price'],
            volume=0
        )
    return None

def create_fallback_candle(conn, stock_code: str, interval_type: str, candle_time: datetime) -> Optional[CandleDTO]:
    """데이터 없을 때 가장 최근 캔들의 종가로 대체 캔들 생성 및 저장"""
    candle = build_fallback_candle(conn, stock_code, interval_type, candle_time)
    if candle:
        save_candles(conn, [candle])
    return candle

def get_latest_candle(conn, stock_code: str, interval_type: str) -> Optional[dict]:
    """해당 종목의 가장 최근 캔들 조회"""
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
