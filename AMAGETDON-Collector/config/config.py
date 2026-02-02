import os
import socket
from dotenv import load_dotenv

load_dotenv()

def get_fallback_host(port: int):
    try:
        socket.create_connection(('host.docker.internal', port), timeout=1)
        return 'host.docker.internal'
    except (socket.timeout, socket.error, OSError):
        return 'localhost'

def get_db_host():
    env_host = os.getenv('DB_HOST')
    if env_host:
        return env_host
    return get_fallback_host(3306)

def get_redis_host():
    env_host = os.getenv('REDIS_HOST')
    if env_host:
        return env_host
    return get_fallback_host(6379)

DB_CONFIG = {
    'host': get_db_host(),
    'port': 3306,
    'user': 'root',
    'password': os.getenv('DB_PASSWORD'),
    'database': 'amagetdon',
    'charset': 'utf8mb4'
}

REDIS_CONFIG = {
    'host': get_redis_host(),
    'port': 6379
}

COLLECTION_CONFIG = {
    'realtime_interval': 5,
}

REDIS_KEYS = {
    'top_10_stocks': 'kis:top_10_stocks',
    'user_stocks': 'kis:user_stocks'
}
