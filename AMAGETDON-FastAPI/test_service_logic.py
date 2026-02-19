"""
quiz_service 핵심 로직 테스트 (DB 연결 없이)
_load_csv_data, _get_quizzes_from_csv, _validate_quiz 직접 검증
"""
import csv
import io
import sys
import random
from pathlib import Path
from enum import Enum
from typing import List, Optional

# Windows 터미널 UTF-8 출력
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

PASS = "[PASS]"
FAIL = "[FAIL]"
INFO = "[INFO]"

errors = []

def check(name, condition, detail=""):
    if condition:
        print(f"  {PASS} {name}")
    else:
        print(f"  {FAIL} {name}" + (f" -> {detail}" if detail else ""))
        errors.append(name)


# ── quiz_service 핵심 로직 인라인 복제 (DB 의존성 제거) ──────────────

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
QUIZ_CSV = DATA_DIR / "quizzes.csv"
CHOICES_CSV = DATA_DIR / "quiz_choices.csv"


class QuizType(str, Enum):
    OX = "OX"
    MCQ = "MCQ"

class Difficulty(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

class ChoiceData:
    def __init__(self, choice_text, choice_no, is_answer):
        self.choice_text = choice_text
        self.choice_no = choice_no
        self.is_answer = is_answer

class LocalQuizData:
    def __init__(self, quiz_type, quiz_content, answer_ox, choices, difficulty, hint, explanation_text):
        self.quiz_type = quiz_type
        self.quiz_content = quiz_content
        self.answer_ox = answer_ox
        self.choices = choices
        self.difficulty = difficulty
        self.hint = hint
        self.explanation_text = explanation_text


def _load_csv_data():
    if not QUIZ_CSV.exists():
        raise FileNotFoundError(f"quizzes.csv 없음: {QUIZ_CSV}")
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
    result = []
    for quiz_id, q in quizzes.items():
        try:
            answer_ox = None
            if q["quiz_type"] == "OX" and q["answer_ox"]:
                answer_ox = q["answer_ox"].upper() == "TRUE"
            choices = q["choices"] if q["quiz_type"] == "MCQ" and q["choices"] else None
            result.append(LocalQuizData(
                quiz_type=QuizType(q["quiz_type"]),
                quiz_content=q["quiz_content"],
                answer_ox=answer_ox,
                choices=choices,
                difficulty=Difficulty(q["difficulty"]),
                hint=q["hint"],
                explanation_text=q["explanation_text"],
            ))
        except Exception as e:
            print(f"  {FAIL} 변환 실패 (quiz_id={quiz_id}): {e}")
            errors.append(f"변환 실패 id={quiz_id}")
    return result


def _get_quizzes_from_csv(all_quizzes, count, difficulty, quiz_type):
    available = all_quizzes
    if difficulty != "RANDOM":
        available = [q for q in available if q.difficulty.value == difficulty]
    if quiz_type != "RANDOM":
        available = [q for q in available if q.quiz_type.value == quiz_type]
    if not available:
        raise ValueError(f"조건에 맞는 퀴즈 없음 (difficulty={difficulty}, quiz_type={quiz_type})")
    return random.choices(available, k=count)


def _validate_quiz(quiz_data):
    if not quiz_data.quiz_content:
        return False
    if quiz_data.quiz_type == QuizType.OX:
        if quiz_data.answer_ox is None:
            return False
    if quiz_data.quiz_type == QuizType.MCQ:
        if not quiz_data.choices or len(quiz_data.choices) != 4:
            return False
        answer_count = sum(1 for c in quiz_data.choices if c.is_answer)
        if answer_count != 1:
            return False
    return True


# ── 테스트 실행 ───────────────────────────────────────────────────────

print("\n[1] _load_csv_data() - CSV 로드 및 LocalQuizData 변환")
try:
    all_quizzes = _load_csv_data()
    check("CSV 로드 성공", True)
    check("100개 로드", len(all_quizzes) == 100, f"실제: {len(all_quizzes)}개")
    ox = [q for q in all_quizzes if q.quiz_type == QuizType.OX]
    mcq = [q for q in all_quizzes if q.quiz_type == QuizType.MCQ]
    check("OX 50개", len(ox) == 50, f"실제: {len(ox)}개")
    check("MCQ 50개", len(mcq) == 50, f"실제: {len(mcq)}개")
    print(f"  {INFO} OX: {len(ox)}, MCQ: {len(mcq)}")
except Exception as e:
    check("CSV 로드 성공", False, str(e))
    sys.exit(1)


print("\n[2] _validate_quiz() - 개별 퀴즈 데이터 유효성")
invalid = [q for q in all_quizzes if not _validate_quiz(q)]
check("모든 퀴즈 검증 통과", len(invalid) == 0,
      f"검증 실패 {len(invalid)}개: {[q.quiz_content[:20] for q in invalid[:3]]}")

# OX 샘플 검증
sample_ox = next((q for q in all_quizzes if q.quiz_type == QuizType.OX), None)
if sample_ox:
    check("OX 문제 answer_ox 존재", sample_ox.answer_ox is not None)
    check("OX 문제 choices 없음", sample_ox.choices is None)
    print(f"  {INFO} OX 샘플: \"{sample_ox.quiz_content[:40]}...\" / 정답={sample_ox.answer_ox}")

# MCQ 샘플 검증
sample_mcq = next((q for q in all_quizzes if q.quiz_type == QuizType.MCQ), None)
if sample_mcq:
    check("MCQ 문제 choices 4개", sample_mcq.choices and len(sample_mcq.choices) == 4)
    check("MCQ 정답 1개", sum(1 for c in sample_mcq.choices if c.is_answer) == 1)
    answer = next(c for c in sample_mcq.choices if c.is_answer)
    print(f"  {INFO} MCQ 샘플: \"{sample_mcq.quiz_content[:35]}...\"")
    print(f"  {INFO} 정답: ({answer.choice_no}번) {answer.choice_text[:30]}")


print("\n[3] _get_quizzes_from_csv() - 필터링 및 랜덤 추출")

# RANDOM 10개
batch = _get_quizzes_from_csv(all_quizzes, 10, "RANDOM", "RANDOM")
check("RANDOM 10개 추출", len(batch) == 10)
check("모두 유효", all(_validate_quiz(q) for q in batch))

# EASY MCQ 필터
easy_mcq = _get_quizzes_from_csv(all_quizzes, 5, "EASY", "MCQ")
check("EASY+MCQ 5개 추출", len(easy_mcq) == 5)
check("모두 EASY+MCQ", all(q.difficulty == Difficulty.EASY and q.quiz_type == QuizType.MCQ for q in easy_mcq))

# HARD OX 필터
hard_ox = _get_quizzes_from_csv(all_quizzes, 3, "HARD", "OX")
check("HARD+OX 3개 추출", len(hard_ox) == 3)
check("모두 HARD+OX", all(q.difficulty == Difficulty.HARD and q.quiz_type == QuizType.OX for q in hard_ox))

# 존재하지 않는 필터 예외 처리
try:
    _get_quizzes_from_csv(all_quizzes, 1, "MEDIUM", "INVALID_TYPE")
    check("잘못된 타입 예외 발생", False, "ValueError가 발생해야 함")
except ValueError:
    check("잘못된 타입 ValueError 발생", True)


print("\n[4] 실제 generate_quiz_batch 흐름 시뮬레이션 (DB 저장 제외)")
generated = 0
for quiz in _get_quizzes_from_csv(all_quizzes, 10, "RANDOM", "RANDOM"):
    if _validate_quiz(quiz):
        generated += 1
check("10개 배치 생성 시뮬레이션 성공", generated == 10, f"실제: {generated}개")
print(f"  {INFO} 배치 생성 {generated}/10개 통과")


print("\n" + "=" * 55)
if errors:
    print(f"테스트 실패: {len(errors)}개 오류")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)
else:
    print(f"모든 테스트 통과  퀴즈 서비스 로직 정상 동작 확인")
    sys.exit(0)
