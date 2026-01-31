from dataclasses import dataclass
from datetime import datetime

@dataclass
class StockDTO:
    stock_code: str
    stock_name: str
    current_price: int
    change_amount: int
    change_rate: float
    volume: int
    trading_value: int
    per: float = None
    pbr: float = None
    eps: int = None
    bps: int = None
    market_cap: int = None  
    
@dataclass
class StockMasterDTO:
    stock_code: str         
    stock_name: str          
    market_type: str         

@dataclass
class CandleDTO:
    stock_code: str
    interval_type: str
    candle_time: datetime
    open_price: int
    high_price: int
    low_price: int
    close_price: int
    volume: int