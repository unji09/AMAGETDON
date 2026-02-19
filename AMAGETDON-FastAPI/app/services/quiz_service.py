import csv
import json
import os
import random
from pathlib import Path
from sqlalchemy.orm import Session
from datetime import datetime
from models.quiz_models import (
    CachedQuiz,
    CachedQuizChoice,
    QuizTypeEnum,
    DifficultyEnum,
)
from models.quiz_dto import LocalQuizData, ChoiceData, QuizGenerateResponse, QuizType, Difficulty
from app.repositories.quiz_repository import QuizRepository

# CSV 파일 경로 (AMAGETDON-FastAPI/data/)
BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data"
QUIZ_CSV = DATA_DIR / "quizzes.csv"
CHOICES_CSV = DATA_DIR / "quiz_choices.csv"

# 모듈 수준 캐시 (프로세스 재시작 전까지 파일을 한 번만 읽음)
_quiz_data_cache = None


class QuizService:
    """퀴즈 비즈니스 로직"""

    def __init__(self, db: Session):
        self.db = db
        self.repository = QuizRepository(db)

    def check_and_generate_if_needed(
        self, difficulty: str = "RANDOM", quiz_type: str = "RANDOM"
    ) -> QuizGenerateResponse:
        """
        캐싱 퀴즈 개수 확인 후 부족하면 자동 생성
        100개 이하면 10개 생성

        Args:
            difficulty: 난이도 (RANDOM/EASY/MEDIUM/HARD)
            quiz_type: 타입 (RANDOM/OX/MCQ)

        Returns:
            QuizGenerateResponse: 생성 결과
        """
        unused_count = self.repository.count_unused_quizzes()

        if unused_count <= 100:
            return self.generate_quiz_batch(difficulty, quiz_type, count=10)
        else:
            total_count = self.repository.count_all_quizzes()
            return QuizGenerateResponse(generated_count=0, cached_total=total_count)

    def generate_quiz_batch(
        self, difficulty: str, quiz_type: str, count: int = 10
    ) -> QuizGenerateResponse:
        """
        CSV 파일에서 퀴즈를 읽어 cached_quizzes 테이블에 일괄 저장

        Args:
            difficulty: 난이도 (RANDOM/EASY/MEDIUM/HARD)
            quiz_type: 타입 (RANDOM/OX/MCQ)
            count: 생성할 퀴즈 개수 (기본 10개)

        Returns:
            QuizGenerateResponse: 생성 결과
        """
        generated_count = 0
        backup_data = []

        quizzes = self._get_quizzes_from_csv(count, difficulty, quiz_type)

        for i, quiz_data in enumerate(quizzes):
            try:
                if not self._validate_quiz(quiz_data):
                    print(f"퀴즈 검증 실패 ({i+1}/{count})")
                    continue

                self._save_quiz_to_db(quiz_data)
                backup_data.append(quiz_data.dict())
                generated_count += 1

            except Exception as e:
                print(f"퀴즈 저장 실패 ({i+1}/{count}): {str(e)}")
                continue

        if backup_data:
            self._save_backup(backup_data)

        cached_total = self.repository.count_all_quizzes()

        return QuizGenerateResponse(
            generated_count=generated_count, cached_total=cached_total
        )

    def generate_quiz(self, difficulty: str, quiz_type: str) -> QuizGenerateResponse:
        """
        CSV 파일에서 퀴즈 1개를 읽어 DB 저장 (레거시 메서드)

        Args:
            difficulty: 난이도 (RANDOM/EASY/MEDIUM/HARD)
            quiz_type: 타입 (RANDOM/OX/MCQ)

        Returns:
            QuizGenerateResponse: 생성 결과
        """
        quizzes = self._get_quizzes_from_csv(1, difficulty, quiz_type)

        if not quizzes:
            raise ValueError("CSV 파일에서 조건에 맞는 퀴즈를 찾을 수 없습니다")

        quiz_data = quizzes[0]

        if not self._validate_quiz(quiz_data):
            raise ValueError("퀴즈 데이터가 유효하지 않습니다")

        self._save_quiz_to_db(quiz_data)
        self._save_backup([quiz_data.dict()])

        cached_total = self.repository.count_all_quizzes()

        return QuizGenerateResponse(generated_count=1, cached_total=cached_total)

    def _get_quizzes_from_csv(
        self, count: int, difficulty: str, quiz_type: str
    ) -> list:
        """
        CSV에서 조건에 맞는 퀴즈 N개를 랜덤 추출

        Args:
            count: 추출할 개수
            difficulty: 난이도 필터 (RANDOM이면 전체)
            quiz_type: 타입 필터 (RANDOM이면 전체)

        Returns:
            List[LocalQuizData]: 선택된 퀴즈 리스트
        """
        all_quizzes = self._load_csv_data()

        available = all_quizzes
        if difficulty != "RANDOM":
            available = [q for q in available if q.difficulty.value == difficulty]
        if quiz_type != "RANDOM":
            available = [q for q in available if q.quiz_type.value == quiz_type]

        if not available:
            raise ValueError(
                f"조건에 맞는 퀴즈가 없습니다 (difficulty={difficulty}, quiz_type={quiz_type})"
            )

        return random.choices(available, k=count)

    def _load_csv_data(self) -> list:
        """
        CSV 파일을 읽어 LocalQuizData 리스트 반환
        최초 1회만 파일을 읽고 이후에는 캐시에서 반환

        Returns:
            List[LocalQuizData]: 전체 퀴즈 리스트

        Raises:
            FileNotFoundError: quizzes.csv 파일이 없을 때
        """
        global _quiz_data_cache

        if _quiz_data_cache is not None:
            return _quiz_data_cache

        if not QUIZ_CSV.exists():
            raise FileNotFoundError(
                f"퀴즈 CSV 파일이 없습니다: {QUIZ_CSV}\n"
                f"{DATA_DIR} 디렉토리에 quizzes.csv 파일을 추가해주세요."
            )

        # quizzes.csv 읽기
        quizzes = {}
        with open(QUIZ_CSV, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                quiz_id = row["quiz_id"].strip()
                quizzes[quiz_id] = {
                    "quiz_type": row["quiz_type"].strip(),
                    "quiz_content": row["quiz_content"].strip(),
                    "answer_ox": row.get("answer_ox", "").strip(),
                    "difficulty": row["difficulty"].strip(),
                    "hint": row.get("hint", "").strip() or None,
                    "explanation_text": row.get("explanation_text", "").strip() or None,
                    "choices": [],
                }

        # quiz_choices.csv 읽기 (존재하는 경우)
        if CHOICES_CSV.exists():
            with open(CHOICES_CSV, encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    quiz_id = row["quiz_id"].strip()
                    if quiz_id in quizzes:
                        quizzes[quiz_id]["choices"].append(
                            ChoiceData(
                                choice_text=row["choice_text"].strip(),
                                choice_no=int(row["choice_no"].strip()),
                                is_answer=row["is_answer"].strip().upper() == "TRUE",
                            )
                        )

        # LocalQuizData 변환
        result = []
        for quiz_id, q in quizzes.items():
            try:
                answer_ox = None
                if q["quiz_type"] == "OX" and q["answer_ox"]:
                    answer_ox = q["answer_ox"].upper() == "TRUE"

                choices = q["choices"] if q["quiz_type"] == "MCQ" and q["choices"] else None

                result.append(
                    LocalQuizData(
                        quiz_type=QuizType(q["quiz_type"]),
                        quiz_content=q["quiz_content"],
                        answer_ox=answer_ox,
                        choices=choices,
                        difficulty=Difficulty(q["difficulty"]),
                        hint=q["hint"],
                        explanation_text=q["explanation_text"],
                    )
                )
            except Exception as e:
                print(f"퀴즈 변환 실패 (quiz_id={quiz_id}): {e}")

        print(f"CSV 로드 완료: {len(result)}개 퀴즈")
        _quiz_data_cache = result
        return _quiz_data_cache

    def _validate_quiz(self, quiz_data: LocalQuizData) -> bool:
        """
        퀴즈 데이터 검증
        필수 필드 체크, OX/MCQ 별 조건 확인

        Args:
            quiz_data: 검증할 퀴즈 데이터

        Returns:
            bool: 유효 여부
        """
        if not quiz_data.quiz_content:
            return False

        if quiz_data.quiz_type == QuizTypeEnum.OX:
            if quiz_data.answer_ox is None:
                return False

        if quiz_data.quiz_type == QuizTypeEnum.MCQ:
            if not quiz_data.choices or len(quiz_data.choices) != 4:
                return False

            answer_count = sum(1 for c in quiz_data.choices if c.is_answer)
            if answer_count != 1:
                return False

        return True

    def _save_quiz_to_db(self, quiz_data: LocalQuizData) -> None:
        """
        퀴즈를 cached_quizzes 테이블에 저장

        Args:
            quiz_data: 저장할 퀴즈 데이터
        """
        quiz = CachedQuiz(
            quiz_type=quiz_data.quiz_type,
            quiz_content=quiz_data.quiz_content,
            answer_ox=quiz_data.answer_ox,
            difficulty=quiz_data.difficulty,
            hint=quiz_data.hint,
            explanation_text=quiz_data.explanation_text,
            is_used=False,
        )

        saved_quiz = self.repository.save_quiz(quiz)

        if quiz_data.quiz_type == QuizTypeEnum.MCQ and quiz_data.choices:
            choices = [
                CachedQuizChoice(
                    cached_quiz_id=saved_quiz.cached_quiz_id,
                    choice_text=choice.choice_text,
                    choice_no=choice.choice_no,
                    is_answer=choice.is_answer,
                )
                for choice in quiz_data.choices
            ]
            self.repository.save_choices(choices)

    def _save_backup(self, quiz_data_list: list) -> None:
        """
        저장된 퀴즈를 로컬에 백업

        Args:
            quiz_data_list: 퀴즈 데이터 리스트 (dict 형태)
        """
        backup_dir = "backup/quizzes"
        os.makedirs(backup_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{backup_dir}/quiz_backup_{timestamp}.json"

        with open(filename, "w", encoding="utf-8") as f:
            json.dump(quiz_data_list, f, ensure_ascii=False, indent=2)

        print(f"백업 완료: {filename} (총 {len(quiz_data_list)}개)")

    def export_all_to_csv(self) -> str:
        import csv

        quizzes = self.repository.get_all_quizzes()

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir = "backup/quizzes"
        os.makedirs(backup_dir, exist_ok=True)
        csv_path = f"{backup_dir}/quizzes_{timestamp}.csv"

        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(
                [
                    "cached_quiz_id",
                    "quiz_type",
                    "quiz_content",
                    "answer_ox",
                    "difficulty",
                    "hint",
                    "explanation_text",
                    "choice1_text",
                    "choice1_is_answer",
                    "choice2_text",
                    "choice2_is_answer",
                    "choice3_text",
                    "choice3_is_answer",
                    "choice4_text",
                    "choice4_is_answer",
                ]
            )

            for quiz in quizzes:
                choices = (
                    sorted(quiz.choices, key=lambda c: c.choice_no)
                    if quiz.choices
                    else []
                )

                choice_data = []
                for i in range(4):
                    if i < len(choices):
                        choice_data.extend(
                            [choices[i].choice_text, choices[i].is_answer]
                        )
                    else:
                        choice_data.extend(["", ""])

                writer.writerow(
                    [
                        quiz.cached_quiz_id,
                        quiz.quiz_type,
                        quiz.quiz_content,
                        quiz.answer_ox,
                        quiz.difficulty,
                        quiz.hint,
                        quiz.explanation_text,
                        *choice_data,
                    ]
                )

        print(f"CSV 내보내기 완료: {csv_path} (총 {len(quizzes)}개)")
        return csv_path
