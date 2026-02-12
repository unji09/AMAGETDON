import json
import os
import requests
from sqlalchemy.orm import Session
from datetime import datetime
from config.config import settings
from models.quiz_models import (
    CachedQuiz,
    CachedQuizChoice,
    QuizTypeEnum,
    DifficultyEnum,
)
from models.quiz_dto import GmsQuizData, QuizGenerateResponse
from app.repositories.quiz_repository import QuizRepository


class QuizService:
    """퀴즈 생성 비즈니스 로직"""

    # GMS API 설정
    GMS_API_URL = "https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent"

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
        # 미사용 퀴즈 개수 확인
        unused_count = self.repository.count_unused_quizzes()

        if unused_count <= 100:
            # 10개 일괄 생성
            return self.generate_quiz_batch(difficulty, quiz_type, count=10)
        else:
            # 생성 불필요
            total_count = self.repository.count_all_quizzes()
            return QuizGenerateResponse(generated_count=0, cached_total=total_count)

    def generate_quiz_batch(
        self, difficulty: str, quiz_type: str, count: int = 10
    ) -> QuizGenerateResponse:
        """
        여러 개의 퀴즈를 한 번에 생성

        Args:
            difficulty: 난이도
            quiz_type: 타입
            count: 생성할 퀴즈 개수 (기본 10개)

        Returns:
            QuizGenerateResponse: 생성 결과
        """
        generated_count = 0
        backup_data = []

        for i in range(count):
            try:
                # GMS API 호출
                quiz_data = self._call_gms_api(difficulty, quiz_type)

                # 검증
                if not self._validate_quiz(quiz_data):
                    print(f"퀴즈 검증 실패 ({i+1}/{count})")
                    continue

                # DB 저장
                self._save_quiz_to_db(quiz_data)

                # 백업용 데이터 수집
                backup_data.append(quiz_data.dict())

                generated_count += 1

            except Exception as e:
                print(f"퀴즈 생성 실패 ({i+1}/{count}): {str(e)}")
                continue

        # 로컬 백업 저장
        if backup_data:
            self._save_backup(backup_data)

        # 전체 캐싱 개수 조회
        cached_total = self.repository.count_all_quizzes()

        return QuizGenerateResponse(
            generated_count=generated_count, cached_total=cached_total
        )

    def generate_quiz(self, difficulty: str, quiz_type: str) -> QuizGenerateResponse:
        """
        AI로 퀴즈 1개 생성 및 DB 저장 (레거시 메서드)
        전체 퀴즈 생성 플로우 관리
        GMS 호출 -> 검증 -> 저장 -> 응답

        Args:
            difficulty: 난이도 (RANDOM/EASY/MEDIUM/HARD)
            quiz_type: 타입 (RANDOM/OX/MCQ)

        Returns:
            QuizGenerateResponse: 생성 결과
        """
        # 1. GMS API 호출
        quiz_data = self._call_gms_api(difficulty, quiz_type)

        # 2. 검증
        if not self._validate_quiz(quiz_data):
            raise ValueError("생성된 퀴즈가 유효하지 않습니다")

        # 3. DB 저장
        self._save_quiz_to_db(quiz_data)

        # 4. 백업 저장
        self._save_backup([quiz_data.dict()])

        # 5. 현재 캐싱 개수 조회
        cached_total = self.repository.count_all_quizzes()

        return QuizGenerateResponse(generated_count=1, cached_total=cached_total)

    def _call_gms_api(self, difficulty: str, quiz_type: str) -> GmsQuizData:
        """
        GMS API 호출하여 퀴즈 생성
        JSON 응답 파싱 (마크다운 코드 블록 제거)

        Args:
            difficulty: 난이도
            quiz_type: 타입

        Returns:
            GmsQuizData: 파싱된 퀴즈 데이터
        """
        # 프롬프트 생성
        prompt = self._create_prompt(difficulty, quiz_type)

        # 요청 헤더
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": settings.gms_api_key,
        }

        # 요청 바디
        payload = {"contents": [{"parts": [{"text": prompt}]}]}

        # API 호출
        response = requests.post(
            self.GMS_API_URL, headers=headers, json=payload, timeout=30
        )

        # 응답 확인
        if response.status_code != 200:
            raise Exception(
                f"GMS API 호출 실패: {response.status_code} - {response.text}"
            )

        # 응답 파싱
        response_data = response.json()

        # GMS 응답 구조에서 텍스트 추출
        response_text = response_data["candidates"][0]["content"]["parts"][0][
            "text"
        ].strip()

        # 마크다운 코드 블록 제거
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        response_text = response_text.strip()

        # JSON → Pydantic 모델
        quiz_dict = json.loads(response_text)
        return GmsQuizData(**quiz_dict)

    def _create_prompt(self, difficulty: str, quiz_type: str) -> str:
        """
        GMS API 프롬프트 생성

        Args:
            difficulty: 난이도
            quiz_type: 타입

        Returns:
            str: 프롬프트 문자열
        """
        # 난이도 결정
        if difficulty == "RANDOM":
            diff_instruction = "난이도는 EASY, MEDIUM, HARD 중 랜덤으로 선택하세요."
            target_diff = "랜덤"
        else:
            diff_instruction = f"난이도는 반드시 {difficulty}로 생성하세요."
            target_diff = difficulty

        # 타입 결정
        if quiz_type == "RANDOM":
            type_instruction = "퀴즈 타입은 OX 또는 MCQ 중 랜덤으로 선택하세요."
            target_type = "랜덤"
        else:
            type_instruction = f"퀴즈 타입은 반드시 {quiz_type}로 생성하세요."
            target_type = quiz_type

        prompt = f"""
                당신은 주식 투자 교육 전문가입니다. 20-30대 초보 투자자를 위한 창의적이고 실용적인 퀴즈를 생성해주세요.

                **요구사항:**
                - {type_instruction}
                - {diff_instruction}
                - 한국 주식 시장 기준
                - 실제 투자 상황에서 유용한 지식
                - 최신 투자 트렌드 반영

                **창의성 가이드:**
                - 단순 암기가 아닌 이해와 응용을 묻는 문제
                - 실제 사례나 시나리오 기반 문제
                - 함정 선택지를 포함하여 변별력 확보
                - 다양한 주제: 재무제표, 차트 분석, 투자 심리, 시장 용어, 투자 전략 등

                **MCQ 선택지 작성 규칙 (매우 중요):**
                1. 정답 위치를 1번, 2번, 3번, 4번 중 랜덤하게 배치하세요
                2. 각 보기 번호가 정답이 될 확률은 동일해야 합니다 (25% 균등 분포)
                3. 오답 선택지도 그럴듯하게 작성하여 난이도를 조절하세요
                4. 명백히 틀린 선택지는 피하고, 헷갈릴 수 있는 선택지를 만드세요

                **JSON 응답 형식:**
                {{
                  "quiz_type": "OX" 또는 "MCQ",
                  "quiz_content": "문제 내용 (구체적이고 명확하게)",
                  "answer_ox": true 또는 false (OX인 경우만),
                  "choices": [
                    {{"choice_text": "선택지 내용", "choice_no": 1, "is_answer": true 또는 false}},
                    {{"choice_text": "선택지 내용", "choice_no": 2, "is_answer": true 또는 false}},
                    {{"choice_text": "선택지 내용", "choice_no": 3, "is_answer": true 또는 false}},
                    {{"choice_text": "선택지 내용", "choice_no": 4, "is_answer": true 또는 false}}
                  ] (MCQ인 경우만, 반드시 정확히 4개, is_answer는 정확히 1개만 true),
                  "difficulty": "EASY" 또는 "MEDIUM" 또는 "HARD",
                  "hint": "문제 해결에 도움이 되는 힌트",
                  "explanation_text": "정답 해설 및 추가 학습 내용"
                }}

                **검증 규칙:**
                1. OX 퀴즈: answer_ox 필드 필수, choices 필드 없음
                2. MCQ 퀴즈: choices 필드 필수, 반드시 정확히 4개, is_answer가 true인 항목은 정확히 1개만
                3. 정답 위치는 매번 다르게 (1, 2, 3, 4번 중 랜덤)
                4. 모든 필드는 한국어로 작성
                5. JSON 형식만 응답 (추가 설명이나 마크다운 없이)

                **예시 (정답 위치가 다양한 경우):**
                - 1번이 정답인 경우도 있고
                - 3번이 정답인 경우도 있고
                - 4번이 정답인 경우도 있어야 함

                난이도: {target_diff}
                타입: {target_type}

                지금 창의적이고 유익한 퀴즈를 생성해주세요!
                """
        return prompt

    def _validate_quiz(self, quiz_data: GmsQuizData) -> bool:
        """
        생성된 퀴즈 검증
        필수 필드 체크
        OX / MCQ 별 검증
        정답 개수 검증

        Args:
            quiz_data: 검증할 퀴즈 데이터

        Returns:
            bool: 유효 여부
        """
        # 필수 필드 체크
        if not quiz_data.quiz_content:
            return False

        # OX 검증
        if quiz_data.quiz_type == QuizTypeEnum.OX:
            if quiz_data.answer_ox is None:
                return False

        # MCQ 검증
        if quiz_data.quiz_type == QuizTypeEnum.MCQ:
            # 선택지 개수는 정확히 4개
            if not quiz_data.choices or len(quiz_data.choices) != 4:
                return False

            # 정답 개수 체크 (정확히 1개)
            answer_count = sum(1 for c in quiz_data.choices if c.is_answer)
            if answer_count != 1:
                return False

        return True

    def _save_quiz_to_db(self, quiz_data: GmsQuizData) -> None:
        """
        퀴즈를 DB에 저장
        ORM 엔티티 생성
        Repository를 통한 저장

        Args:
            quiz_data: 저장할 퀴즈 데이터
        """
        # CachedQuiz 엔티티 생성
        quiz = CachedQuiz(
            quiz_type=quiz_data.quiz_type,
            quiz_content=quiz_data.quiz_content,
            answer_ox=quiz_data.answer_ox,
            difficulty=quiz_data.difficulty,
            hint=quiz_data.hint,
            explanation_text=quiz_data.explanation_text,
            is_used=False,
        )

        # 퀴즈 저장
        saved_quiz = self.repository.save_quiz(quiz)

        # MCQ인 경우 선택지 저장
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
        생성된 퀴즈를 로컬에 백업

        Args:
            quiz_data_list: 퀴즈 데이터 리스트 (dict 형태)
        """
        # 백업 디렉토리 생성
        backup_dir = "backup/quizzes"
        os.makedirs(backup_dir, exist_ok=True)

        # 파일명: YYYYMMDD_HHMMSS.json
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{backup_dir}/quiz_backup_{timestamp}.json"

        # JSON 저장
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
