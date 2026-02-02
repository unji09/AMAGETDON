import joblib
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, Dict, List
from models.personality_dto import InvestmentType, PersonalityAnalyzeResponse

class PersonalityService:

    # 업적 ID 순서 (AchievementIdCode 참고)
    ACHIEVEMENT_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

    # 최소 업적 개수
    MIN_ACHIEVEMENT_COUNT = 5

    # 레이블 매핑
    LABEL_TO_TYPE = {
        0: InvestmentType.AGGRESSIVE,
        1: InvestmentType.STABLE,
        2: InvestmentType.NEUTRAL
    }

    # 모델을 클래스 변수로 (한 번만 로드)
    _model = None
    _model_path = "ml/personality_model.pkl"

    @classmethod
    def _load_model(cls):
        """모델을 한 번만 로드"""
        if cls._model is None:
            try:
                cls._model = joblib.load(cls._model_path)
            except FileNotFoundError:
                raise FileNotFoundError(f"모델 파일을 찾을 수 없습니다: {cls._model_path}")
        return cls._model

    def __init__(self, db: Session):
        self.db = db
        self.model = self._load_model()  # 이미 로드되어 있으면 재사용

    def analyze_personality(self, user_id: int) -> PersonalityAnalyzeResponse:
        """
        사용자 성향 분석

        Args:
            user_id: 사용자 ID

        Returns:
            PersonalityAnalyzeResponse: 분석 결과
        """
        # 1. 사용자 달성 업적 조회
        user_achievements = self._get_user_achievements(user_id)
        achievement_count = len(user_achievements)

        # 2. 최소 업적 개수 체크
        if achievement_count < self.MIN_ACHIEVEMENT_COUNT:
            return PersonalityAnalyzeResponse(
                success=False,
                can_analyze=False,
                achievement_count=achievement_count,
                message=f"최소 {self.MIN_ACHIEVEMENT_COUNT}개 이상의 업적이 필요합니다"
            )

        # 3. 현재 저장된 성향 조회
        initial_type = self._get_current_investment_type(user_id)

        # 4. 특성 벡터 생성
        feature_vector = self._build_feature_vector(user_achievements)

        # 5. ML 예측
        predicted_label = self.model.predict([feature_vector])[0]
        probabilities = self.model.predict_proba([feature_vector])[0]

        predicted_type = self.LABEL_TO_TYPE[predicted_label]
        confidence = float(probabilities[predicted_label])

        # 6. 확률 딕셔너리 생성
        prob_dict = {
            "AGGRESSIVE": float(probabilities[0]),
            "STABLE": float(probabilities[1]),
            "NEUTRAL": float(probabilities[2])
        }

        return PersonalityAnalyzeResponse(
            success=True,
            can_analyze=True,
            achievement_count=achievement_count,
            initial_type=initial_type,
            predicted_type=predicted_type,
            confidence=confidence,
            probabilities=prob_dict,
            message=None
        )

    def _get_user_achievements(self, user_id: int) -> List[int]:
        """
        사용자가 달성한 업적 ID 목록 조회

        Args:
            user_id: 사용자 ID

        Returns:
            List[int]: 달성한 업적 ID 리스트
        """
        query = text("""
            SELECT achievement_id
            FROM user_achievements
            WHERE user_id = :user_id AND is_achieved = 1
        """)

        result = self.db.execute(query, {"user_id": user_id})
        achievement_ids = [row[0] for row in result.fetchall()]
        return achievement_ids

    def _get_current_investment_type(self, user_id: int) -> Optional[InvestmentType]:
        """
        사용자의 현재 투자 성향 조회

        Args:
            user_id: 사용자 ID

        Returns:
            Optional[InvestmentType]: 현재 성향 (없으면 None)
        """
        query = text("""
            SELECT investment_type
            FROM users
            WHERE user_id = :user_id
        """)

        result = self.db.execute(query, {"user_id": user_id})
        row = result.fetchone()

        if row and row[0]:
            return InvestmentType(row[0])
        return None

    def _build_feature_vector(self, achieved_ids: List[int]) -> np.ndarray:
        """
        업적 달성 여부를 18차원 특성 벡터로 변환

        Args:
            achieved_ids: 달성한 업적 ID 리스트

        Returns:
            np.ndarray: [0 or 1] x 18 벡터
        """
        feature_vector = np.zeros(18, dtype=int)

        for idx, achievement_id in enumerate(self.ACHIEVEMENT_IDS):
            if achievement_id in achieved_ids:
                feature_vector[idx] = 1

        return feature_vector