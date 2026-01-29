import pytz
from datetime import datetime
from utils.logger import logger

def is_market_open() -> bool:
    now = datetime.now(pytz.timezone('Asia/Seoul'))
    hour = now.hour
    minute = now.minute
    weekday = now.weekday()
    
    if weekday >= 5:
        logger.warning(f"주말 (현재: {now.strftime('%Y-%m-%d %H:%M')})")
        return False
    
    if hour < 9 or (hour == 15 and minute >= 30) or hour > 15:
        logger.warning(f"장외 시간 (현재: {now.strftime('%H:%M')})")
        return False
    
    return True