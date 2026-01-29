from typing import List
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
