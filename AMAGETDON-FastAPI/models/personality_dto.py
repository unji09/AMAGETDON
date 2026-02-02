from pydantic import BaseModel, Field
from typing import Dict, Optional
from enum import Enum

class InvestmentType(str, Enum):
    AGGRESSIVE = "AGGRESSIVE"
    STABLE = "STABLE"
    NEUTRAL = "NEUTRAL"

# FastAPI 요청
class PersonalityAnalyzeRequest(BaseModel):
    """
    성향 분석 요청
    """
    user_id: int = Field(..., description="사용자 ID")

# FastAPI 응답
class PersonalityAnalyzeResponse(BaseModel):
    """
    성향 분석 응답
    """
    success: bool = Field(..., description="분석 성공 여부")
    can_analyze: bool = Field(..., description="분석 가능 여부 (업적 5개 이상)")
    achievement_count: int = Field(..., description="달성한 업적 개수")
    initial_type: Optional[InvestmentType] = Field(None, description="현재 저장된 성향")
    predicted_type: Optional[InvestmentType] = Field(None, description="ML 예측 성향")
    confidence: Optional[float] = Field(None, description="예측 신뢰도 (0.0~1.0)")
    probabilities: Optional[Dict[str, float]] = Field(None, description="각 성향별 확률")
    message: Optional[str] = Field(None, description="메시지 (분석 불가 시)")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "can_analyze": True,
                "achievement_count": 7,
                "initial_type": "STABLE",
                "predicted_type": "AGGRESSIVE",
                "confidence": 0.85,
                "probabilities": {
                    "AGGRESSIVE": 0.85,
                    "STABLE": 0.10,
                    "NEUTRAL": 0.05
                },
                "message": None
            }
        }