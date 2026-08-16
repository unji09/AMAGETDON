from typing import List, Optional
import json
import pymysql
from datetime import datetime, timedelta
from config.config import DB_CONFIG, REDIS_KEYS
from models.dto import StockDTO, CandleDTO

def get_db_connection(conn):
    if conn is None or not conn.open:
        return pymysql.connect(**DB_CONFIG)
    return conn

def cache_stock_price(redis_client, stock: StockDTO):
    key = f"{REDIS_KEYS['stock_price']}:{stock.stock_code}"
    data = json.dumps({
        'currentPrice': str(stock.current_price),
        'volume': stock.volume,
        'tradingValue': stock.trading_value,
        'changeAmount': stock.change_amount,
        'changeRate': float(stock.change_rate) if stock.change_rate else 0.0
    })
    redis_client.set(key, data, ex=30)

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

def _filter_stocks_with_user_data(cursor, stock_codes: List[str]) -> tuple:
    placeholders = ','.join(['%s'] * len(stock_codes))
    cursor.execute(
        f"""SELECT DISTINCT stock_code FROM watchlist WHERE stock_code IN ({placeholders})
            UNION
            SELECT DISTINCT stock_code FROM stock_holdings WHERE stock_code IN ({placeholders})
            UNION
            SELECT DISTINCT stock_code FROM transaction WHERE stock_code IN ({placeholders})""",
        stock_codes + stock_codes + stock_codes
    )
    has_user_data = {row[0] for row in cursor.fetchall()}
    deletable = [c for c in stock_codes if c not in has_user_data]
    return deletable, has_user_data

def delete_stock(conn, stock_code: str):
    cursor = conn.cursor()
    deletable, skipped = _filter_stocks_with_user_data(cursor, [stock_code])
    if not deletable:
        return skipped
    cursor.execute("DELETE FROM stock_prices WHERE stock_code = %s", (stock_code,))
    cursor.execute("DELETE FROM chart_candles WHERE stock_code = %s", (stock_code,))
    cursor.execute("DELETE FROM stock WHERE stock_code = %s", (stock_code,))
    conn.commit()
    return skipped

def delete_stocks(conn, stock_codes: List[str]):
    if not stock_codes:
        return set()
    cursor = conn.cursor()
    deletable, skipped = _filter_stocks_with_user_data(cursor, stock_codes)
    if not deletable:
        return skipped
    placeholders = ','.join(['%s'] * len(deletable))
    cursor.execute(f"DELETE FROM stock_prices WHERE stock_code IN ({placeholders})", deletable)
    cursor.execute(f"DELETE FROM chart_candles WHERE stock_code IN ({placeholders})", deletable)
    cursor.execute(f"DELETE FROM stock WHERE stock_code IN ({placeholders})", deletable)
    conn.commit()
    return skipped

def save_closing_prices(conn) -> int:
    cursor = conn.cursor()
    today = datetime.now().date()

    cursor.execute(
        "SELECT stock_code, close_price, volume FROM chart_candles "
        "WHERE interval_type = '1d' AND DATE(candle_time) = %s",
        (today,)
    )
    candles = cursor.fetchall()

    if not candles:
        return 0

    stock_codes = [row[0] for row in candles]
    placeholders = ','.join(['%s'] * len(stock_codes))
    cursor.execute(
        f"""SELECT sp.stock_code, sp.trading_value, sp.change_amount, sp.change_rate
            FROM stock_prices sp
            INNER JOIN (
                SELECT stock_code, MAX(price_id) as max_id
                FROM stock_prices
                WHERE stock_code IN ({placeholders})
                GROUP BY stock_code
            ) latest ON sp.price_id = latest.max_id""",
        stock_codes
    )
    last_data = {row[0]: (row[1], row[2], row[3]) for row in cursor.fetchall()}

    now = datetime.now()
    insert_data = []
    for stock_code, close_price, volume in candles:
        trading_value, change_amount, change_rate = last_data.get(
            stock_code, (0, 0, 0.0)
        )
        insert_data.append((
            stock_code, str(close_price), volume, trading_value,
            change_amount, float(change_rate), now
        ))

    cursor.executemany(
        """INSERT INTO stock_prices
           (stock_code, current_price, volume, trading_value, change_amount, change_rate, created_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        insert_data
    )

    conn.commit()
    return len(insert_data)


def cleanup_old_data(conn) -> dict:
    cursor = conn.cursor()

    cursor.execute(
        """DELETE FROM stock_prices
           WHERE price_id NOT IN (
               SELECT max_id FROM (
                   SELECT MAX(price_id) AS max_id
                   FROM stock_prices
                   GROUP BY stock_code
               ) latest
           )"""
    )
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
