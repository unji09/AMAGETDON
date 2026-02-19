from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from config.database import get_db
from models.quiz_dto import QuizGenerateRequest, QuizGenerateResponse
from app.services.quiz_service import QuizService

router = APIRouter(prefix="/api/quiz", tags=["Quiz Generation"])


@router.post(
    "/generate",
    response_model=QuizGenerateResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_quiz(request: QuizGenerateRequest, db: Session = Depends(get_db)):
    """
    AI 퀴즈 생성 API

    Spring Boot에서 호출하여 캐싱 퀴즈 생성
    미사용 캐싱 퀴즈가 100개 이하면 자동으로 10개 생성
    `QuizGenerateRequest` 검증 (Pydantic)
    `QuizService`를 통한 퀴즈 생성

    Args:
        request: 퀴즈 생성 요청 (difficulty, quiz_type)
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

        # 자동 체크 후 필요시 생성 (100개 이하면 10개 생성)
        response = service.check_and_generate_if_needed(
            difficulty=request.difficulty, quiz_type=request.quiz_type
        )

        return response

    except ValueError as e:
        # 검증 실패
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # 기타 오류
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"퀴즈 생성 중 오류가 발생했습니다: {str(e)}",
        )


@router.post(
    "/generate/batch",
    response_model=QuizGenerateResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_quiz_batch(
    count: int = 10,
    difficulty: str = "RANDOM",
    quiz_type: str = "RANDOM",
    db: Session = Depends(get_db),
):
    """
    퀴즈 일괄 생성 API (수동 호출용)

    지정된 개수만큼 퀴즈를 일괄 생성
    관리자 또는 배치 작업에서 사용

    Args:
        count: 생성할 퀴즈 개수 (기본 10개, 최대 50개 권장)
        difficulty: 난이도 (RANDOM/EASY/MEDIUM/HARD)
        quiz_type: 타입 (RANDOM/OX/MCQ)
        db: 데이터베이스 세션 (의존성 주입)

    Returns:
        QuizGenerateResponse: 생성 결과 (generated_count, cached_total)

    Raises:
        HTTPException 400: count가 유효하지 않음 (1~50)
        HTTPException 500: 퀴즈 생성 실패
    """
    # count 검증
    if count < 1 or count > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="생성 개수는 1~50 사이여야 합니다",
        )

    try:
        # QuizService 인스턴스 생성
        service = QuizService(db)

        # 일괄 생성
        response = service.generate_quiz_batch(
            difficulty=difficulty, quiz_type=quiz_type, count=count
        )

        return response

    except Exception as e:
        # 기타 오류
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"퀴즈 일괄 생성 중 오류: {str(e)}",
        )


@router.post("/generate/bulk", status_code=status.HTTP_202_ACCEPTED)
def generate_quiz_bulk(
    total_count: int = 33000,
    batch_size: int = 50,
    difficulty: str = "RANDOM",
    quiz_type: str = "RANDOM",
    db: Session = Depends(get_db),
):
    if total_count > 50000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="최대 50,000개까지 생성 가능합니다",
        )

    try:
        service = QuizService(db)
        total_generated = 0
        total_batches = (total_count + batch_size - 1) // batch_size

        for batch_num in range(total_batches):
            current_size = min(batch_size, total_count - total_generated)

            result = service.generate_quiz_batch(
                difficulty=difficulty, quiz_type=quiz_type, count=current_size
            )

            total_generated += result.generated_count
            print(
                f"[{batch_num + 1}/{total_batches}] 진행: {total_generated}/{total_count}"
            )

        # 전체 CSV 백업
        csv_path = service.export_all_to_csv()

        return {
            "total_generated": total_generated,
            "csv_path": csv_path,
            "message": "대량 생성 완료",
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"대량 생성 중 오류: {str(e)}",
        )


@router.get("/status")
def get_quiz_cache_status(db: Session = Depends(get_db)):
    """
    캐싱 퀴즈 현황 조회 API

    미사용 및 전체 퀴즈 개수 확인용

    Returns:
        dict: 캐싱 현황
            - unused_count: 미사용 퀴즈 개수
            - total_count: 전체 퀴즈 개수
            - should_generate: 생성이 필요한지 여부 (100개 이하)
    """
    try:
        from app.repositories.quiz_repository import QuizRepository

        repository = QuizRepository(db)

        unused_count = repository.count_unused_quizzes()
        total_count = repository.count_all_quizzes()

        return {
            "unused_count": unused_count,
            "total_count": total_count,
            "should_generate": unused_count <= 100,
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"현황 조회 실패: {str(e)}",
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
