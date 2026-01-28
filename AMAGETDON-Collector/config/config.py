import os
from dotenv import load_dotenv

load_dotenv()

# DB 설정
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': 3306,
    'user': 'root',
    'password': os.getenv('DB_PASSWORD'),
    'database': 'amagetdon',
    'charset': 'utf8mb4'
}

# API 설정
API_CONFIG = {
    'key': os.getenv('API_KEY', ''),
    'secret': os.getenv('API_SECRET', '')
}

# 수집 설정
COLLECTION_CONFIG = {
    'realtime_interval': 5,
}