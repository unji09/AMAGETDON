import pymysql
from datetime import datetime
from config.config import DB_CONFIG
from models.dto import StockDTO

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