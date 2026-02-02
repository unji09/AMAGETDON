from sqlalchemy.orm import Session
from sqlalchemy import func
from models.quiz_models import CachedQuiz, CachedQuizChoice
from typing import Optional

class QuizRepository:
    """캐싱 퀴즈 데이터베이스 접근 레이어"""

    def __init__(self, db: Session):
        self.db = db

    def save_quiz(self, quiz: CachedQuiz) -> CachedQuiz:
        """
        퀴즈를 DB에 저장

        Args:
            quiz: CachedQuiz 엔티티

        Returns:
            저장된 CachedQuiz 엔티티 (ID 포함)
        """
        self.db.add(quiz)
        self.db.commit()
        # 퀴즈 저장 후 refresh()로 ID 로드
        self.db.refresh(quiz)
        return quiz

    def save_choices(self, choices: list[CachedQuizChoice]) -> None:
        """
        선택지 목록을 DB에 저장

        Args:
            choices: CachedQuizChoice 엔티티 리스트
        """
        self.db.add_all(choices)
        self.db.commit()

    def count_unused_quizzes(self) -> int:
        """
        미사용 캐싱 퀴즈 개수 조회
        1000개 미만인지 판단용

        Returns:
            is_used=False인 퀴즈 개수
        """
        return self.db.query(func.count(CachedQuiz.cached_quiz_id))\
            .filter(CachedQuiz.is_used == False)\
            .scalar()

    def count_all_quizzes(self) -> int:
        """
        전체 캐싱 퀴즈 개수 조회

        Returns:
            전체 퀴즈 개수
        """
        return self.db.query(func.count(CachedQuiz.cached_quiz_id)).scalar()