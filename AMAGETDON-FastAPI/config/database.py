from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from config.config import settings
from typing import Generator

# MySQL 연결 URL 생성
DATABASE_URL = (
    f"mysql+pymysql://{settings.mysql_user}:{settings.mysql_password}"
    f"@{settings.mysql_host}:{settings.mysql_port}/{settings.mysql_database}"
    f"?charset=utf8mb4"
)

# SQLAlchemy 엔진 생성
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # 연결 유효성 자동 체크
    pool_recycle=3600,       # 1시간마다 연결 재생성
    echo=False,              # SQL 로그 출력 (개발: True, 운영: False)
    pool_size=5,             # 커넥션 풀 크기
    max_overflow=10          # 추가 가능한 최대 연결 수
)

# 세션 팩토리 생성
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db() -> Generator[Session, None, None]:
    """
    데이터베이스 세션 의존성

    FastAPI 라우터에서 사용:
        @router.post("/generate")
        def generate(db: Session = Depends(get_db)):
            ...

    Yields:
        Session: SQLAlchemy 세션
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()