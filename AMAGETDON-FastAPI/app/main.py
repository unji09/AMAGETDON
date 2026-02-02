from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import quiz_router, personality_router

# FastAPI 앱 생성
app = FastAPI(
    title="AMAGETDON Quiz Generation API",
    description="AI 기반 주식 투자 퀴즈 생성 서비스",
    version="1.0.0"
)

# CORS 설정 (Spring Boot에서 호출 가능하도록)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO(민규) 운영 환경에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(quiz_router.router)
app.include_router(personality_router.router)

@app.get("/")
def root():
    """
    루트 엔드포인트

    Returns:
        dict: API 정보
    """
    return {
        "service": "AMAGETDON Quiz Generation API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
def health():
    """
    전체 서비스 헬스 체크

    Returns:
        dict: 서비스 상태
    """
    return {"status": "healthy"}