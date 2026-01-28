import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': 3306,
    'user': 'root',
    'password': os.getenv('DB_PASSWORD'),
    'database': 'amagetdon',
    'charset': 'utf8mb4'
}

API_CONFIG = {
    'key': os.getenv('API_KEY', ''),
    'secret': os.getenv('API_SECRET', '')
}

COLLECTION_CONFIG = {
    'realtime_interval': 5,
}

REDIS_KEYS = {
    'top_30_stocks': 'kis:top_30_stocks',
    'user_stocks': 'kis:user_stocks'
}
