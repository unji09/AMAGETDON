from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from config.database import get_db
from models.personality_dto import PersonalityAnalyzeRequest, PersonalityAnalyzeResponse
from app.services.personality_service import PersonalityService

router = APIRouter(
    prefix="/api/personality",
    tags=["Personality Analysis"]
)

@router.post("/analyze", response_model=PersonalityAnalyzeResponse, status_code=status.HTTP_200_OK)
def analyze_personality(
    request: PersonalityAnalyzeRequest,
    db: Session = Depends(get_db)
):
    """
    업적 기반 투자 성향 분석 API

    사용자의 달성한 업적 패턴을 분석하여 투자 성향을 예측합니다.

    **조건:**
    - 최소 5개 이상의 업적 달성 필요

    **반환:**
    - 예측된 성향 (AGGRESSIVE, STABLE, NEUTRAL)
    - 신뢰도 (0.0 ~ 1.0)
    - 각 성향별 확률

    Args:
        request: 분석 요청 (user_id)
        db: 데이터베이스 세션 (의존성 주입)

    Returns:
        PersonalityAnalyzeResponse: 분석 결과

    Raises:
        HTTPException 404: 사용자 없음
        HTTPException 500: 분석 실패
    """
    try:
        # PersonalityService 인스턴스 생성
        service = PersonalityService(db)

        # 성향 분석
        response = service.analyze_personality(user_id=request.user_id)

        return response

    except FileNotFoundError as e:
        # 모델 파일 없음
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ML 모델 로드 실패: {str(e)}"
        )
    except Exception as e:
        # 기타 오류
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"성향 분석 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/health")
def health_check():
    """
    헬스 체크 엔드포인트
    성향 분석 서비스 상태 확인용

    Returns:
        dict: 서비스 상태
    """
    return {"status": "ok", "service": "personality-analysis"}