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
    
    def __str__(self):
        return (f"{self.stock_name}({self.stock_code}): "
                f"{self.current_price:,}원 "
                f"({self.change_rate:+.2f}%)")

@dataclass
class StockMasterDTO:
    stock_code: str         
    stock_name: str          
    market_type: str         