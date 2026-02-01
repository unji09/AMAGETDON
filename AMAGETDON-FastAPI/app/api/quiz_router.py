from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from config.database import get_db
from models.quiz_dto import QuizGenerateRequest, QuizGenerateResponse
from app.services.quiz_service import QuizService

router = APIRouter(
    prefix="/api/quiz",
    tags=["Quiz Generation"]
)

@router.post("/generate", response_model=QuizGenerateResponse, status_code=status.HTTP_201_CREATED)
def generate_quiz(
    request: QuizGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    AI 퀴즈 생성 API

    Spring Boot에서 호출하여 캐싱 퀴즈 생성
    `QuizGenerateRequest` 검증 (Pydantic)
    `QuizService`를 통한 퀴즈 생성

    Args:
        request: 퀴즈 생성 요청 (count, difficulty, quiz_type)
        db: 데이터베이스 세션 (의존성 주입)

    Returns:
        QuizGenerateResponse: 생성 결과 (generated_count, cached_total)
            HTTP_201_CREATED 응답

    Raises:
        HTTPException 400: 퀴즈 검증 실패
        HTTPException 500: GMS API 호출 실패 또는 DB 저장 실패
    """
    try:
        # QuizService 인스턴스 생성
        service = QuizService(db)

        # 퀴즈 생성
        response = service.generate_quiz(
            difficulty=request.difficulty,
            quiz_type=request.quiz_type
        )

        return response

    except ValueError as e:
        # 검증 실패
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # 기타 오류
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"퀴즈 생성 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/health")
def health_check():
    """
    헬스 체크 엔드포인트
    서버 상태 확인용
    Docker 컨테이너 헬스 체크에 사용

    Returns:
        dict: 서버 상태
    """
    return {"status": "ok", "service": "quiz-generation"}