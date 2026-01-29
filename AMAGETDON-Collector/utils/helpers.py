from typing import Optional

def safe_int(value: str) -> Optional[int]:
    if not value or value.strip() == '':
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None

def safe_float(value: str) -> Optional[float]:
    if not value or value.strip() == '':
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None