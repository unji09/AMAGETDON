"""
CSV 로딩 로직 단위 테스트
quiz_service._load_csv_data() 와 동일한 방식으로 파일을 읽어 검증
"""
import csv
import sys
import io

# Windows 터미널 UTF-8 출력 강제
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from pathlib import Path

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
QUIZ_CSV = DATA_DIR / "quizzes.csv"
CHOICES_CSV = DATA_DIR / "quiz_choices.csv"

PASS = "\033[92m[PASS]\033[0m"
FAIL = "\033[91m[FAIL]\033[0m"
INFO = "\033[94m[INFO]\033[0m"

errors = []
warnings = []


def check(name, condition, detail=""):
    if condition:
        print(f"  {PASS} {name}")
    else:
        print(f"  {FAIL} {name}" + (f" — {detail}" if detail else ""))
        errors.append(name)


# ── 1. 파일 존재 확인 ─────────────────────────────────────────────────
print("\n[1] 파일 존재 확인")
check("quizzes.csv 존재", QUIZ_CSV.exists(), str(QUIZ_CSV))
check("quiz_choices.csv 존재", CHOICES_CSV.exists(), str(CHOICES_CSV))

if not QUIZ_CSV.exists():
    print(f"\n{FAIL} quizzes.csv 없음. 테스트 중단.")
    sys.exit(1)


# ── 2. quizzes.csv 파싱 ───────────────────────────────────────────────
print("\n[2] quizzes.csv 파싱")

quizzes = {}
parse_errors = []

with open(QUIZ_CSV, encoding="utf-8") as f:
    reader = csv.DictReader(f)
    headers = reader.fieldnames
    required_cols = {"quiz_id", "quiz_type", "quiz_content", "answer_ox", "difficulty"}
    check("필수 컬럼 존재", required_cols.issubset(set(headers or [])),
          f"누락: {required_cols - set(headers or [])}")

    for i, row in enumerate(reader, start=2):  # 헤더가 1행
        qid = row.get("quiz_id", "").strip()
        qtype = row.get("quiz_type", "").strip()
        content = row.get("quiz_content", "").strip()
        answer_ox = row.get("answer_ox", "").strip()
        difficulty = row.get("difficulty", "").strip()

        # 필드 검증
        if not qid:
            parse_errors.append(f"행{i}: quiz_id 빈값")
            continue
        if qtype not in ("OX", "MCQ"):
            parse_errors.append(f"행{i}(id={qid}): quiz_type='{qtype}' (OX/MCQ여야 함)")
        if not content:
            parse_errors.append(f"행{i}(id={qid}): quiz_content 빈값")
        if difficulty not in ("EASY", "MEDIUM", "HARD"):
            parse_errors.append(f"행{i}(id={qid}): difficulty='{difficulty}' (EASY/MEDIUM/HARD여야 함)")
        if qtype == "OX" and answer_ox not in ("TRUE", "FALSE"):
            parse_errors.append(f"행{i}(id={qid}): OX문제인데 answer_ox='{answer_ox}' (TRUE/FALSE여야 함)")
        if qtype == "MCQ" and answer_ox not in ("", None):
            if answer_ox:
                parse_errors.append(f"행{i}(id={qid}): MCQ문제인데 answer_ox='{answer_ox}' (빈값이어야 함)")

        quizzes[qid] = {"quiz_type": qtype, "difficulty": difficulty, "choices": []}

total = len(quizzes)
ox_count = sum(1 for q in quizzes.values() if q["quiz_type"] == "OX")
mcq_count = sum(1 for q in quizzes.values() if q["quiz_type"] == "MCQ")
easy = sum(1 for q in quizzes.values() if q["difficulty"] == "EASY")
medium = sum(1 for q in quizzes.values() if q["difficulty"] == "MEDIUM")
hard = sum(1 for q in quizzes.values() if q["difficulty"] == "HARD")

check("총 퀴즈 수 > 0", total > 0, f"현재 {total}개")
check("파싱 오류 없음", len(parse_errors) == 0,
      "\n    ".join(parse_errors[:10]) + ("..." if len(parse_errors) > 10 else ""))

print(f"  {INFO} 총 {total}개 (OX: {ox_count}, MCQ: {mcq_count})")
print(f"  {INFO} 난이도 - EASY: {easy}, MEDIUM: {medium}, HARD: {hard}")


# ── 3. quiz_choices.csv 파싱 ─────────────────────────────────────────
print("\n[3] quiz_choices.csv 파싱")

choice_errors = []

if CHOICES_CSV.exists():
    with open(CHOICES_CSV, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        headers_c = reader.fieldnames
        required_c = {"quiz_id", "choice_no", "choice_text", "is_answer"}
        check("필수 컬럼 존재", required_c.issubset(set(headers_c or [])),
              f"누락: {required_c - set(headers_c or [])}")

        for i, row in enumerate(reader, start=2):
            qid = row.get("quiz_id", "").strip()
            choice_no = row.get("choice_no", "").strip()
            choice_text = row.get("choice_text", "").strip()
            is_answer = row.get("is_answer", "").strip().upper()

            if qid not in quizzes:
                choice_errors.append(f"행{i}: quiz_id={qid} 가 quizzes.csv에 없음")
                continue
            if not choice_no.isdigit() or int(choice_no) not in (1, 2, 3, 4):
                choice_errors.append(f"행{i}(quiz_id={qid}): choice_no='{choice_no}' (1~4여야 함)")
            if not choice_text:
                choice_errors.append(f"행{i}(quiz_id={qid}): choice_text 빈값")
            if is_answer not in ("TRUE", "FALSE"):
                choice_errors.append(f"행{i}(quiz_id={qid}): is_answer='{is_answer}' (TRUE/FALSE여야 함)")

            quizzes[qid]["choices"].append({"choice_no": choice_no, "is_answer": is_answer})

    check("파싱 오류 없음", len(choice_errors) == 0,
          "\n    ".join(choice_errors[:10]) + ("..." if len(choice_errors) > 10 else ""))


# ── 4. MCQ 선택지 정합성 검증 ────────────────────────────────────────
print("\n[4] MCQ 선택지 정합성 검증")

mcq_errors = []
for qid, q in quizzes.items():
    if q["quiz_type"] != "MCQ":
        continue
    choices = q["choices"]
    if len(choices) != 4:
        mcq_errors.append(f"quiz_id={qid}: 선택지 {len(choices)}개 (4개여야 함)")
        continue
    answer_cnt = sum(1 for c in choices if c["is_answer"] == "TRUE")
    if answer_cnt != 1:
        mcq_errors.append(f"quiz_id={qid}: 정답 {answer_cnt}개 (1개여야 함)")
    choice_nos = sorted(c["choice_no"] for c in choices)
    if choice_nos != ["1", "2", "3", "4"]:
        mcq_errors.append(f"quiz_id={qid}: choice_no={choice_nos} (1,2,3,4여야 함)")

check("MCQ 선택지 수 정확 (모두 4개)", len(mcq_errors) == 0,
      "\n    ".join(mcq_errors[:10]) + ("..." if len(mcq_errors) > 10 else ""))
print(f"  {INFO} MCQ {mcq_count}개 선택지 검증 완료")


# ── 5. 랜덤 추출 시뮬레이션 ──────────────────────────────────────────
print("\n[5] 랜덤 추출 시뮬레이션 (quiz_service._get_quizzes_from_csv 동작 확인)")
import random

all_ids = list(quizzes.keys())

# RANDOM 10개
sample = random.choices(all_ids, k=10)
check("RANDOM 10개 추출 가능", len(sample) == 10)

# EASY OX 필터링
easy_ox = [qid for qid, q in quizzes.items() if q["difficulty"] == "EASY" and q["quiz_type"] == "OX"]
check("EASY+OX 필터 가능", len(easy_ox) > 0, f"해당 문제 {len(easy_ox)}개")

# HARD MCQ 필터링
hard_mcq = [qid for qid, q in quizzes.items() if q["difficulty"] == "HARD" and q["quiz_type"] == "MCQ"]
check("HARD+MCQ 필터 가능", len(hard_mcq) > 0, f"해당 문제 {len(hard_mcq)}개")
print(f"  {INFO} 샘플 추출 quiz_id: {sample[:5]}...")


# ── 최종 결과 ─────────────────────────────────────────────────────────
print("\n" + "=" * 55)
if errors:
    print(f"\033[91m테스트 실패: {len(errors)}개 오류\033[0m")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)
else:
    print(f"\033[92m모든 테스트 통과 ✓  퀴즈 {total}개 검증 완료\033[0m")
    sys.exit(0)
