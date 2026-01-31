# AMAGETDON Fast-API

AI 기반 주식 투자 퀴즈 생성 서비스

## 기술 스택

- **FastAPI**: Python 웹 프레임워크
- **SQLAlchemy**: ORM
- **PyMySQL**: MySQL 드라이버
- **GMS (Gemini 2.5 Flash Lite)**: AI 퀴즈 생성
- **Docker**: 컨테이너화

## 주요 기능

- AI 기반 주식 투자 퀴즈 자동 생성
- OX 및 객관식(MCQ) 퀴즈 지원
- 난이도별 생성 (EASY, MEDIUM, HARD)
- MySQL 캐싱 퀴즈 저장
- Spring Boot 백엔드와 연동

## 로컬 개발 환경 설정

### 1. 환경 변수 설정
```bash
cp .env.template .env
# .env 파일 편집하여 실제 값 입력
```

### 2. Docker Compose 실행
```bash
docker compose up -d
```

### 3. API 확인
```cmd
# 헬스 체크
curl http://localhost:8000/health

# API 문서
start http://localhost:8000/docs
```

## API 엔드포인트

### POST /api/quiz/generate

퀴즈 생성 요청

**Request:**
```json
{
  "count": 1,
  "difficulty": "RANDOM",
  "quiz_type": "RANDOM"
}
```

**Response:**
```json
{
  "generated_count": 1,
  "cached_total": 856
}
```

### GET /health

서버 상태 확인

**Response:**
```json
{
  "status": "healthy"
}
```

## 디렉토리 구조
```
AMAGETDON-Fast-API/
├── app/
│   ├── api/              # API 라우터
│   ├── services/         # 비즈니스 로직
│   └── repositories/     # 데이터 액세스
├── config/               # 설정 파일
├── models/               # 데이터 모델
├── .env                  # 환경 변수 (Git 제외)
├── .env.template          # 환경 변수 템플릿
├── requirements.txt      # Python 의존성
├── Dockerfile
├── docker-compose.yaml
└── README.md
```

## 개발 가이드

### 로컬에서 실행 (Docker 없이)
```bash
# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
uvicorn app.main:app --reload
```

### 테스트
```bash
# 퀴즈 생성 테스트
curl -X POST http://localhost:8000/api/quiz/generate \
  -H "Content-Type: application/json" \
  -d '{"count": 1, "difficulty": "EASY", "quiz_type": "MCQ"}'
```

## 주의사항

- `GMS_API_KEY`는 SSAFY GMS 서비스 키 사용
- MySQL은 AMAGETDON-BE의 컨테이너 사용 (`host.docker.internal`)
- 프로덕션 환경에서는 CORS 설정 제한 필요