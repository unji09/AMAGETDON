from dataclasses import dataclass

@dataclass
class StockDTO:
    stock_code: str
    stock_name: str | None
    current_price: int
    change_amount: int
    change_rate: float
    volume: int
    trading_value: int    
    
@dataclass
class StockMasterDTO:
    stock_code: str         
    stock_name: str          
    market_type: str         