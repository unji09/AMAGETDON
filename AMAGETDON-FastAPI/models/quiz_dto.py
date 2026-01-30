from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class QuizType(str, Enum):
    OX = "OX"
    MCQ = "MCQ"

class Difficulty(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

# Spring → FastAPI 요청
class QuizGenerateRequest(BaseModel):
    """
    Spring Boot에서 퀴즈 생성 요청
    count는 항상 1 (검증 포함)
    """
    count: int = Field(default=1, ge=1, le=1)
    difficulty: str = Field(default="RANDOM")
    quiz_type: str = Field(default="RANDOM")

# FastAPI → Spring 응답
class QuizGenerateResponse(BaseModel):
    """
    퀴즈 생성 결과 응답
    generated_count: 생성된 개수
    cached_total: 현재 캐싱된 총 개수
    """
    generated_count: int
    cached_total: int

# GMS API 응답 파싱용
class ChoiceData(BaseModel):
    """객관식 선택지 데이터"""
    choice_text: str
    choice_no: int
    is_answer: bool

class GmsQuizData(BaseModel):
    """GMS API로부터 생성된 퀴즈 데이터"""
    quiz_type: QuizType
    quiz_content: str
    answer_ox: Optional[bool] = None
    choices: Optional[List[ChoiceData]] = None
    difficulty: Difficulty
    hint: Optional[str] = None
    explanation_text: Optional[str] = None