from sqlalchemy import Column, BigInteger, String, Text, Boolean, Enum, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class QuizTypeEnum(str, enum.Enum):
    OX = "OX"
    MCQ = "MCQ"

class DifficultyEnum(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

class CachedQuiz(Base):
    """
    캐싱 퀴즈 모델

    Relationships:
        choices: 1:N 관계 - 하나의 퀴즈는 여러 선택지를 가짐
    """
    __tablename__ = "cached_quizzes"

    cached_quiz_id = Column(BigInteger, primary_key=True, autoincrement=True)
    quiz_type = Column(Enum(QuizTypeEnum), nullable=False)
    quiz_content = Column(Text, nullable=False)
    answer_ox = Column(Boolean, nullable=True)
    difficulty = Column(Enum(DifficultyEnum), nullable=False)
    hint = Column(Text, nullable=True)
    explanation_text = Column(Text, nullable=True)
    is_used = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    # 1:N 관계 - 하나의 퀴즈는 여러 선택지를 가짐
    choices = relationship("CachedQuizChoice", back_populates="quiz", cascade="all, delete-orphan")

class CachedQuizChoice(Base):
    """
    캐싱 퀴즈 선택지 모델

    Relationships:
        quiz: N:1 관계 - 여러 선택지는 하나의 퀴즈에 속함
    """
    __tablename__ = "cached_quiz_choices"

    cached_choice_id = Column(BigInteger, primary_key=True, autoincrement=True)
    cached_quiz_id = Column(BigInteger, ForeignKey('cached_quizzes.cached_quiz_id'), nullable=False)
    choice_text = Column(String(300), nullable=False)
    choice_no = Column(Integer, nullable=False)
    is_answer = Column(Boolean, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    # N:1 관계 - 여러 선택지는 하나의 퀴즈에 속함
    quiz = relationship("CachedQuiz", back_populates="choices")