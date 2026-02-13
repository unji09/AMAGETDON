# 🎓 AmaGetDon

### 투자 성향 기반 맞춤 학습 플랫폼

*20~30대 초보 투자자를 위한 실전형 주식 교육 서비스*

![랜딩페이지1](./src/img/landing_page_01.png)
![랜딩페이지2](C:\Users\SSAFY\Desktop\src\img\landing_page_02.gif)![](C:\Users\SSAFY\Desktop\src\img\landing_page_03.png)

![랜딩페이지4](C:\Users\SSAFY\Desktop\src\img\landing_page_04.png)

[🌐 데모 보기](https://amagetdon.site) |[🪧 Jira 보드](https://ssafy.atlassian.net/jira/software/c/projects/S14P11A207/boards/11751?useStoredSettings=true) | [🐛 이슈 리포트](https://lab.ssafy.com/s14-webmobile1-sub1/S14P11A207)

---

## 📋 목차

- [프로젝트 소개](#🎯-프로젝트-소개)
- [주요 기능](#✨-주요-기능)
- [기술 스택](🛠-기술-스택)
- [시스템 아키텍처](🏗-시스템-아키텍처)
- [ERD](📊-ERD)
- [시작하기](🚀-시작하기)
- [API 문서](📚-API-문서)
- [프로젝트 구조](📁-프로젝트-구조)
- [주요 화면](📱-주요-화면)
- [개발 가이드](💻-개발-가이드)
- [배포](🚢-배포)
- [프로젝트 통계](📊-프로젝트-통계)
- [팀 소개](👥-팀-소개)
- [참고 자료](📚-참고-자료)

---

## 🎯 프로젝트 소개

### 왜 AmaGetDon인가?

> "물가는 오르는데, 내 자산은 그대로다."

20~34세 사회 초년생을 대상으로 한 설문조사에서 투자 시 겪었던 가장 큰 어려움은:

1. **기초 학습 없이 실전 진입** - 유튜브와 커뮤니티의 단편적 정보에 의존
2. **어디서부터 시작해야 할지 막막함** - 체계적인 학습 경로의 부재

AmaGetDon은 **투자와 학습을 완벽하게 결합**한 플랫폼으로, 사용자의 투자 성향에 맞는 맞춤형 커리큘럼과 실전 모의투자를 통해 안전하게 투자 경험을 쌓을 수 있도록 돕습니다.

### 핵심 가치

- 🎯 **성향 기반 맞춤 학습**: 공격형/중립형/안정형 3가지 투자 성향별 최적화된 커리큘럼
- 📚 **학습과 실전의 완전 통합**: 이론 학습 → 퀴즈 → 실전 투자 → 복습의 선순환 구조
- 🎮 **게이미피케이션**: 업적, 랭킹, 보상 시스템으로 지속적인 학습 동기 부여
- 🤖 **AI 기반 성향 재분석**: 실제 투자 행동 패턴을 분석하여 성향을 재진단
- 👥 **커뮤니티 학습**: 스터디룸을 통한 동료 학습과 경쟁

### 타겟 유저

- 20~30대 사회 초년생
- 투자 경험 1년 미만 또는 전무
- 체계적인 투자 학습을 원하는 초보자

---

## ✨ 주요 기능

### 1. 📊 투자 성향 진단

- **초기 설문 조사**: 5개 문항으로 투자 성향 분류

![초기 투자 성향 진단](C:\Users\SSAFY\Desktop\src\img\investment_type_01.png)

- **AI 기반 재분석**: 5개 이상 업적 달성 시 실제 행동 패턴으로 재진단

![투자 성향 재 분석](C:\Users\SSAFY\Desktop\src\img\achievements_invenstment_type.gif)

- **3가지 성향**: 공격형(AGGRESSIVE), 중립형(NEUTRAL), 안정형(STABLE)

### 2. 📚 맞춤형 학습 커리큘럼

![맞춤형 학습](C:\Users\SSAFY\Desktop\src\img\learning_chapters_02.gif)

- **26개 챕터**: 기본 커리큘럼 + 성향별 맞춤 커리큘럼
- **순차적 언락**: 이전 챕터 60% 이상 정답 시 다음 챕터 오픈
- **챕터별 퀴즈**: 10문제 (OX 4문제, 객관식 6문제)
- **보상 시스템**: 일반 커리큘럼 30만원, 성향별 10만원

### 3. 🎯 무한 랜덤 퀴즈 (오늘의 학습)

![](C:\Users\SSAFY\Desktop\src\img\infinite_quiz.gif)

- **매일 새로운 퀴즈**: 980개 퀴즈 풀 + AI 자동 생성
- **유연한 학습량**: 최소 1문제 ~ 최대 100문제
- **차등 보상**: 1번째 10만원, 2~100번째 1천원씩
- **오답 자동 저장**: 틀린 문제는 오답노트로

### 4. 📝 오답노트 & 복습 시스템

<img title="" src="file:///C:/Users/SSAFY/Desktop/src/img/review_note_01.gif" alt="" width="600">

- **자동 저장**: 틀린 문제 자동 수집
- **챕터별 그룹화**: 취약 영역 한눈에 파악
- **재풀이 보상**: 오늘 첫 풀이 정답 시 5만원
- **자동 삭제**: 정답 맞추면 오답노트에서 제거

### 5. 💰 실전 모의투자

<img title="" src="file:///C:/Users/SSAFY/Desktop/src/img/realtime_stock.gif" alt="" width="600">

- **실시간 시세**: 한국투자증권 API 연동
- **초기 자금**: 300만원
- **거래 시간**: 평일 09:00~15:30
- **수수료 자동 계산**: 실제 거래와 동일한 수수료
- **자산 관리**: 현금 잔액, 보유 주식, 총 자산, 수익률

#### 주요 기능

- 종목 검색 및 상세 정보
- 실시간 차트 (1일/1주/3개월/1년)
- 매수/매도 주문
- 거래 내역 조회
- 보유 주식 현황
- 관심 종목 관리

### 6. 🏆 업적 시스템

<img title="" src="file:///C:/Users/SSAFY/Desktop/src/img/achievements_01.gif" alt="" width="600">

**18개 업적**으로 성장 과정을 기록:

| 카테고리 | 업적        | 달성 조건          |
| ---- | --------- | -------------- |
| 출석   | 개근왕       | 7일 연속 출석       |
| 거래   | 계란 나눠들기   | 3개 이상 섹터 분산 투자 |
| 거래   | 넌 내꺼야     | 관심 종목 등록       |
| 거래   | 너로 정했다    | 누적 매수 10회      |
| 커뮤니티 | 아이엠그루브    | 스터디룸 생성        |
| 자산   | 빵야        | 잔액 0원 달성       |
| 자산   | 억만장자      | 잔액 1억원 이상      |
| 학습   | 퀴즈에서 살아남기 | 퀴즈 100문제 정답    |
| 학습   | 주린이 탈출    | 기본 커리큘럼 완료     |
| 산업   | 약사        | 바이오 섹터 매수      |
| 산업   | 강철인간      | 철강/금속 섹터 매수    |
| 산업   | 한반도       | 반도체 섹터 매수      |
| 시간   | 오픈런       | 장 시작 1분 내 매수   |
| 시간   | 버저비터      | 장 마감 1분 전 매수   |

- **업적당 100만원 보상**
- **미달성 업적은 잠금 표시**

### 7. 👥 스터디룸 (커뮤니티)

<img title="" src="file:///C:/Users/SSAFY/Desktop/src/img/community_chat.gif" alt="" width="600">

- **화상 채팅**: OpenVidu 기반 실시간 영상 통화
- **텍스트 채팅**: Redis 기반 실시간 메시지
- **룸 관리**: 생성, 입장, 나가기
- **공개/비공개**: 입장 코드로 비공개 룸 운영
- **1인 1룸 제한**: 동시에 하나의 룸만 참여 가능

### 8. 📊 랭킹 시스템

<img title="" src="file:///C:/Users/SSAFY/Desktop/src/img/ranking_01.gif" alt="" width="600">

**학습 랭킹**

- 정답 개수 기준
- 실시간 순위

**수익 랭킹**

- 총 수익 기준

- 보유 주식 평가액 + (매도 총액 - 매수 총액)

- **자동 집계**: 매 1분마다 업데이트

- **본인 하이라이트**: 내 순위 강조 표시

---

## 🛠 기술 스택

### Backend

| 기술                                                                                               | 버전     | 용도              |
| ------------------------------------------------------------------------------------------------ | ------ | --------------- |
| <img src="file:///C:/Users/SSAFY/Desktop/src/img/Spring.png" title="" alt="" width="70">         | 3.x    | 메인 백엔드 프레임워크    |
| <img src="file:///C:/Users/SSAFY/Desktop/src/img/Java.png" title="" alt="Java" width="72">       | 17+    | 백엔드 언어          |
| <img src="file:///C:/Users/SSAFY/Desktop/src/img/MySQL.png" title="" alt="MySQL" width="65">     | 8.0+   | 주 데이터베이스        |
| <img src="file:///C:/Users/SSAFY/Desktop/src/img/Redis.png" title="" alt="Redis" width="72">     | 7.0+   | 캐싱, 세션, 랭킹, 채팅  |
| <img src="file:///C:/Users/SSAFY/Desktop/src/img/FastAPI.png" title="" alt="FastAPI" width="80"> | 0.100+ | AI 퀴즈 생성, 성향 분석 |

**선택 이유:**

- **Spring Boot**: 팀원 모두 Java 능숙, 엔터프라이즈급 안정성
- **Redis**: 실시간 데이터 처리, 빠른 랭킹 집계
- **FastAPI**: Python AI/ML 라이브러리 활용, 마이크로서비스 분리

### Frontend

| 기술                                                                                            | 버전   | 용도       |
| --------------------------------------------------------------------------------------------- | ---- | -------- |
| <img src="file:///C:/Users/SSAFY/Desktop/src/img/React.png" title="" alt="React" width="102"> | 18.x | UI 프레임워크 |
| <img src="file:///C:/Users/SSAFY/Desktop/src/img/TypeScript.png" title="" alt="" width="109"> | ES6+ | 프론트엔드 언어 |

**선택 이유:**

- **React**: 프론트엔드 대세, React Native 확장 고려

### Infrastructure

| 기술                                                                                              | 용도      |
| ----------------------------------------------------------------------------------------------- | ------- |
| <img src="file:///C:/Users/SSAFY/Desktop/src/img/Docker.png" title="" alt="Docker" width="118"> | 컨테이너화   |
| <img src="file:///C:/Users/SSAFY/Desktop/src/img/AWS.png" title="" alt="AWS" width="91">        | 클라우드 배포 |

### External API & Services

| 서비스         | 용도               |
| ----------- | ---------------- |
| 한국투자증권 API  | 실시간 주식 시세        |
| OpenVidu    | 화상 채팅            |
| Spring Mail | 이메일 발송 (비밀번호 찾기) |

### Development Tools

```
- Build: Gradle 8.x
- IDE: IntelliJ IDEA, VS Code
- API Testing: Postman, Swagger UI
- Version Control: Git, GitLab
- Issue Tracking: Jira
- Communication: Notion, Discord
```

---

## 🏗 시스템 아키텍처

### 전체 구조도

```
┌────────────────────────────────────────────────────────────┐
│                         Client Layer                       │
│  ┌──────────────┐                    ┌──────────────┐      │
│  │ React Web    │                    │ Chrome/Safari│      │
│  │ Application  │                    │   Browser    │      │
│  └──────┬───────┘                    └──────┬───────┘      │
└─────────┼───────────────────────────────────┼──────────────┘
          │                                   │
          │ HTTPS/WebSocket                   │
          │                                   │
┌─────────┼───────────────────────────────────┼──────────────┐
│         ▼                                   ▼              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Gateway / Load Balancer             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────┬──────────────────────────────────────────────────┘
          │
┌─────────┼──────────────────────────────────────────────────┐
│         ▼                Application Layer                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Spring Boot Application                 │  │
│  │                                                      │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │  │
│  │  │  Auth  │ │  User  │ │Trading │ │Learning│  ...    │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘         │  │
│  │                                                      │  │
│  │  ┌─────────────────────────────────────────────┐     │  │
│  │  │         Spring Security + JWT               │     │  │
│  │  └─────────────────────────────────────────────┘     │  │
│  └──────────────────────────────────────────────────────┘  │
│           │                    │                    │      │
└───────────┼────────────────────┼────────────────────┼──────┘
            │                    │                    │
┌───────────┼────────────────────┼────────────────────┼──────┐
│           ▼                    ▼                    ▼      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │    MySQL     │    │    Redis     │    │   FastAPI    │  │
│  │              │    │              │    │              │  │
│  │ - Users      │    │ - Session    │    │ - Quiz Gen   │  │
│  │ - Quizzes    │    │ - Ranking    │    │ - AI Model   │  │
│  │ - Stocks     │    │              │    │ - Propensity │  │
│  │ - Trades     │    │              │    │   Analysis   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                            │
│                   Data & Cache Layer                       │
└────────────────────────────────────────────────────────────┘
            │                                        │
┌───────────┼────────────────────────────────────────┼────────┐
│           ▼                                        ▼        │
│  ┌──────────────────┐                  ┌──────────────────┐ │
│  │ Korea Investment │                  │    OpenVidu      │ │
│  │  Securities API  │                  │     WebRTC       │ │
│  │                  │                  │                  │ │
│  │ - Stock Price    │                  │ - Chat Room      │ │
│  │ - Chart Data     │                  │ - Connection     │ │
│  └──────────────────┘                  └──────────────────┘ │
│                                                             │
│                   External Services                         │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 플로우

#### 1. 사용자 인증 플로우

```
Client → Spring Boot (Login) → MySQL (User 검증)
→ JWT Access Token 발급 (1시간)
→ Refresh Token 발급 → Redis 저장 → HttpOnly Cookie
→ Client (Token 저장)
```

#### 2. 퀴즈 제공 플로우

```
Client → Spring Boot (GET /quizzes/daily)
→ DailyQuizHistory 조회 (오늘 푼 문제 개수)
→ 100개 이하: MySQL Quiz 조회
→ 101개 이상: MySQL CachedQuiz 조회
→ CachedQuiz < 1000: FastAPI 비동기 요청 (퀴즈 생성)
→ Client (퀴즈 반환)
```

#### 3. 실시간 거래 플로우

```
Client → Spring Boot (POST /trading/buy)
→ 거래 시간 검증 (09:00~15:30)
→ 한국투자증권 API (현재가 조회)
→ 수수료 계산
→ MySQL Transaction 저장
→ MySQL StockHolding 업데이트 (평균 단가 재계산)
→ User 잔액 차감
→ Redis 업적 카운터 증가
→ 업적 달성 체크
→ Client (체결 완료)
```

#### 4. 랭킹 집계 플로우

```
Scheduler (매 1분) → Spring Boot
→ MySQL DailyQuizHistory 집계 (정답 개수)
→ MySQL Transaction 집계 (총 수익)
→ MySQL StockHolding 조회 (보유 주식 평가)
→ 순위 계산
→ MySQL LearningRanking, ProfitRanking 삭제 후 재저장
```

---

## 📊 ERD

```mermaid
erDiagram
    %% 사용자 관련
    users {
        BIGINT user_id PK "AUTO_INCREMENT"
        VARCHAR password "암호화된 비밀번호"
        VARCHAR email "사용자 이메일"
        VARCHAR nickname "사용자 닉네임"
        ENUM investment_type "투자성향
        AGGRESSIVE/NEUTRAL/STABLE"
        ENUM login_type "로그인 방식
        LOCAL/KAKAO"
        BIGINT social_id "소셜 로그인 고유 ID"
        VARCHAR current_title "대표 칭호"
        INT total_points "사용자 획득 총 포인트"
        BIGINT balance "사용자 보유 현금"
        DATETIME created_at "계정 생성 일시"
        DATETIME updated_at "정보 수정 일시"
    }

    survey_questions {
        BIGINT question_id PK "설문 질문 고유 식별자"
        VARCHAR question_text "설문 질문 텍스트"
    }

    %% 업적 시스템
    achievements {
        BIGINT achievement_id PK "AUTO_INCREMENT"
        VARCHAR achievement_name "업적 이름"
        VARCHAR achievement_icon "업적 아이콘 경로"
        TEXT achievement_content "업적 달성 조건 설명"
        ENUM achievement_category "업적 카테고리
        ATTENDANCE/TRADE/COMMUNITY"
        BIGINT target_value "업적 달성 기준 수치"
        ENUM comparison_type "비교 기준
        GTE/LTE/EQ"
        DATETIME created_at "업적 생성 일시"
        DATETIME updated_at "업적 수정 일시"
    }

    user_achievements {
        BIGINT user_id PK "복합키"
        BIGINT achievement_id PK "복합키"
        BOOLEAN is_achieved "업적 달성 여부"
        DATETIME achieved_at "업적 달성 일시"
    }

    %% 주식 관련
    stock {
        VARCHAR stock_code PK "주식 종목 코드"
        VARCHAR stock_name "주식 종목명"
        ENUM market_type "시장 구분
        KOSPI/KOSDAQ"
        VARCHAR sector_code FK "업종 분류 코드"
        DECIMAL per "주가수익비율"
        DECIMAL pbr "주가순자산비율"
        INT eps "주당순이익"
        INT bps "주당순자산"
        BIGINT market_cap "시가총액"
        DATETIME created_at "종목 등록 일시"
        DATETIME updated_at "정보 수정 일시"
    }

    sector {
        VARCHAR sector_code PK "섹터업종코드"
        VARCHAR sector_name "섹터업종이름"
        ENUM sector_level "섹터 분류 단계
        LARGE/MIDDLE/SMALL"
        VARCHAR parent_code FK "상위섹터코드"
        DATETIME created_at "섹터 생성 일시"
    }

    stock_prices {
        BIGINT price_id PK "AUTO_INCREMENT"
        VARCHAR stock_code FK "주식 종목 코드"
        VARCHAR current_price "현재 주가"
        INT volume "거래량"
        BIGINT trading_value "거래 대금"
        INT change_amount "전일 대비 변동 금액"
        DECIMAL change_rate "전일 대비 변동률"
        DATETIME created_at "가격 정보 생성 일시"
    }

    chart_candles {
        BIGINT candle_id PK "AUTO_INCREMENT"
        VARCHAR stock_code FK "주식 종목 코드"
        ENUM interval_type "캔들 간격
        1m 5m 30m 1d 1w"
        DATETIME candle_time "캔들 기준 시간"
        INT open_price "시가"
        INT high_price "고가"
        INT low_price "저가"
        INT close_price "종가"
        BIGINT volume "거래량"
        DATETIME created_at "캔들 생성 일시"
    }

    watchlist {
        BIGINT watchlist_id PK "AUTO_INCREMENT"
        BIGINT user_id FK "사용자 고유 식별자"
        VARCHAR stock_code FK "주식 종목 코드"
        DATETIME created_at "관심종목 등록 일시"
    }

    %% 거래 관련
    transaction {
        BIGINT transaction_id PK "AUTO_INCREMENT"
        VARCHAR stock_code FK "거래한 종목 코드"
        BIGINT user_id FK "거래한 사용자 ID"
        ENUM transaction_type "거래 종류
        BUY/SELL"
        INT quantity "거래 수량"
        INT price "거래 단가"
        BIGINT total_amount "거래 총 금액"
        INT fee_amount "거래 수수료"
        DATETIME created_at "거래 발생 일시"
    }

    stock_holdings {
        BIGINT user_id PK "복합키"
        VARCHAR stock_code PK "복합키"
        INT quantity "현재 보유 수량"
        DECIMAL avg_price "평균 매수 단가"
        DATETIME updated_at "보유 정보 수정 일시"
    }

    %% 학습 시스템
    chapters {
        BIGINT chapter_id PK "AUTO_INCREMENT"
        ENUM chapter_type "학습 성향
        NORMAL/AGGRESSIVE/NEUTRAL/STABLE"
        INT base_chapter_no "NORMAL타입챕터순서번호"
        VARCHAR chapter_title "챕터 제목"
        TEXT chapter_summary "챕터 요약"
        TEXT chapter_content "챕터 본문 내용"
        DATETIME created_at "챕터 생성 일시"
        DATETIME updated_at "챕터 수정 일시"
    }

    user_chapter_progresses {
        BIGINT chapter_id PK "복합키"
        BIGINT user_id PK "복합키"
        BOOLEAN is_completed "챕터 완료 여부"
        DATETIME completed_at "챕터 완료 일시"
        DATETIME created_at "진행도 생성 일시"
        DATETIME recent_updated_at "최근 수정 일시"
    }

    quizzes {
        BIGINT quiz_id PK "AUTO_INCREMENT"
        BIGINT chapter_id FK "퀴즈가 속한 챕터 ID"
        ENUM quiz_type "퀴즈 타입
        OX/MCQ"
        VARCHAR quiz_title "퀴즈 제목"
        TEXT quiz_content "퀴즈 문제 내용"
        BOOLEAN answer_ox "OX문제의정답"
        ENUM difficulty "난이도
        EASY/MEDIUM/HARD"
        TEXT hint "퀴즈 힌트"
        TEXT explanation_text "정답 해설"
        DATETIME created_at "퀴즈 생성 일시"
        DATETIME updated_at "퀴즈 수정 일시"
    }

    quiz_choices {
        BIGINT choice_id PK "AUTO_INCREMENT"
        BIGINT quiz_id FK "퀴즈 고유 식별자"
        INT choice_no "선택지 순서"
        VARCHAR choice_text "선택지 텍스트"
        BOOLEAN is_answer "정답 여부"
    }

    daily_quiz_histories {
        BIGINT history_id PK "AUTO_INCREMENT"
        BIGINT user_id FK "사용자 고유 식별자"
        BIGINT quiz_id FK "퀴즈 고유 식별자"
        DATE quiz_date "퀴즈 출제 일자"
        INT quiz_sequence "당일 퀴즈 순서"
        BOOLEAN is_correct "정답 여부"
        DATETIME answered_at "답변 제출 일시"
    }

    cached_quizzes {
        BIGINT cached_quiz_id PK "AUTO_INCREMENT"
        ENUM quiz_type "OX MCQ"
        TEXT quiz_content "퀴즈 문제 내용"
        BOOLEAN answer_ox "OX문제의정답"
        ENUM difficulty "난이도
        EASY/MEDIUM/HARD"
        TEXT hint "퀴즈 힌트"
        TEXT explanation_text "정답 해설"
        BOOLEAN is_used "사용 여부"
        DATETIME created_at "캐시 생성 일시"
        DATETIME updated_at "캐시 수정 일시"
    }

    cached_quiz_choices {
        BIGINT cached_choice_id PK "AUTO_INCREMENT"
        BIGINT cached_quiz_id FK "캐시된퀴즈고유식별자"
        INT choice_no "선택지 순서"
        VARCHAR choice_text "선택지 텍스트"
        BOOLEAN is_answer "정답 여부"
        DATETIME created_at "생성 일시"
        DATETIME updated_at "수정 일시"
    }

    review_notes {
        BIGINT review_note_id PK "AUTO_INCREMENT"
        BIGINT user_id FK "사용자 고유 식별자"
        BIGINT quiz_id FK "퀴즈 고유 식별자"
        DATETIME created_at "오답노트 등록 일시"
    }

    daily_learning_rewards {
        BIGINT reward_id PK "AUTO_INCREMENT"
        BIGINT user_id FK "사용자 고유 식별자"
        DATE quiz_reward_date "일일퀴즈보상수령일자"
        DATE review_reward_date "오답노트보상수령일자"
    }

    %% 커뮤니티
    rooms {
        BIGINT room_id PK "AUTO_INCREMENT"
        VARCHAR name "방 이름"
        INT max_member_count "최대참여가능인원"
        BOOLEAN is_public "공개 방 여부"
        VARCHAR join_code "비공개방참여코드"
        VARCHAR openvidu_session_id "OpenVidu세션ID"
        DATETIME created_at "방 생성 일시"
        DATETIME updated_at "방 정보 수정 일시"
    }

    members {
        BIGINT member_id PK "AUTO_INCREMENT"
        BIGINT room_id FK "방 고유 식별자"
        BIGINT user_id FK "사용자 고유 식별자"
        BOOLEAN is_active "멤버 활성 상태"
        DATETIME joined_at "방 참여 일시"
    }

    %% 랭킹
    profit_rankings {
        BIGINT ranking_id PK "AUTO_INCREMENT"
        BIGINT user_id FK "사용자 고유 식별자"
        INT ranking "수익 순위"
        DECIMAL total_profit "총 수익금"
        DATETIME updated_at "랭킹 갱신 일시"
    }

    learning_rankings {
        BIGINT ranking_id PK "AUTO_INCREMENT"
        BIGINT user_id FK "사용자 고유 식별자"
        INT ranking "학습 순위"
        INT total_correct "총 정답 개수"
        DATETIME updated_at "랭킹 갱신 일시"
    }

    %% 관계 정의
    users ||--o{ user_achievements : "획득"
    achievements ||--o{ user_achievements : "달성"

    users ||--o{ watchlist : "등록"
    stock ||--o{ watchlist : "관심종목"

    users ||--o{ transaction : "거래"
    stock ||--o{ transaction : "거래대상"

    users ||--o{ stock_holdings : "보유"
    stock ||--o{ stock_holdings : "보유종목"

    sector ||--o{ sector : "계층구조"
    sector ||--o{ stock : "분류"

    stock ||--o{ stock_prices : "가격정보"
    stock ||--o{ chart_candles : "차트데이터"

    chapters ||--o{ quizzes : "포함"
    quizzes ||--o{ quiz_choices : "선택지"

    users ||--o{ user_chapter_progresses : "진행"
    chapters ||--o{ user_chapter_progresses : "진행도"

    users ||--o{ daily_quiz_histories : "응시"
    quizzes ||--o{ daily_quiz_histories : "출제"

    cached_quizzes ||--o{ cached_quiz_choices : "선택지"

    users ||--o{ review_notes : "오답등록"
    quizzes ||--o{ review_notes : "오답문제"

    users ||--o{ daily_learning_rewards : "보상수령"

    rooms ||--o{ members : "구성"
    users ||--o{ members : "참여"

    users ||--o{ profit_rankings : "수익랭킹"
    users ||--o{ learning_rankings : "학습랭킹"
```

### 주요 테이블 관계

**회원 도메인**

```
users (1) ─── (N) user_achievements
users (1) ─── (N) user_chapter_progress
users (1) ─── (N) daily_quiz_history
users (1) ─── (1) survey
```

**학습 도메인**

```
chapters (1) ─── (N) quizzes
chapters (1) ─── (N) user_chapter_progress
quizzes (1) ─── (N) quiz_choices
quizzes (1) ─── (N) daily_quiz_history
quizzes (1) ─── (N) review_notes
```

**거래 도메인**

```
users (1) ─── (N) transactions
users (1) ─── (N) stock_holdings
users (1) ─── (N) watchlist
stocks (1) ─── (N) transactions
stocks (1) ─── (N) stock_holdings
stocks (1) ─── (N) stock_prices
stocks (1) ─── (N) chart_candles
stocks (N) ─── (1) sectors
```

**커뮤니티 도메인**

```
rooms (1) ─── (N) members
users (1) ─── (N) members
```

**랭킹 도메인**

```
users (1) ─── (1) learning_ranking
users (1) ─── (1) profit_ranking
```

---

## 🚀 시작하기

### Prerequisites

다음 도구들이 설치되어 있어야 합니다:

- **Java 17+** ([다운로드](https://www.oracle.com/java/technologies/downloads/))
- **Node.js 18+** ([다운로드](https://nodejs.org/))
- **MySQL 8.0+** ([다운로드](https://dev.mysql.com/downloads/))
- **Redis 7.0+** ([다운로드](https://redis.io/download))
- **Docker** (선택, [다운로드](https://www.docker.com/products/docker-desktop))

### 실행

상세 실행 내용은 `/exec` 디렉토리 참조

### 접속

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api/v1
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **FastAPI Docs**: http://localhost:8000/docs

### 기본 계정

개발 환경에서 테스트용 계정:

```
이메일: test@amagetdon.com
비밀번호: test1234!
```

---

## 📚 API 문서

### Swagger UI

API 문서는 Swagger UI를 통해 확인할 수 있습니다:

👉 **http://localhost:8080/swagger-ui.html**

### 인증 방법

모든 API는 JWT 토큰 기반 인증을 사용합니다.

**1. 로그인**

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "test@amagetdon.com",
  "password": "test1234!"
}

# Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "..." # HttpOnly Cookie
}
```

**2. API 요청 시 헤더에 토큰 포함**

```bash
GET /api/v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 주요 API 엔드포인트

#### 인증 (Auth)

| Method | Endpoint         | 설명     |
| ------ | ---------------- | ------ |
| POST   | `/auth/login`    | 로그인    |
| POST   | `/auth/signup`   | 회원가입   |
| POST   | `/auth/logout`   | 로그아웃   |
| POST   | `/auth/refresh`  | 토큰 재발급 |
| DELETE | `/auth/withdraw` | 회원 탈퇴  |

#### 회원 (User)

| Method | Endpoint                | 설명         |
| ------ | ----------------------- | ---------- |
| GET    | `/users/me`             | 내 정보 조회    |
| PUT    | `/users/me`             | 내 정보 수정    |
| POST   | `/users/password/email` | 임시 비밀번호 발송 |
| GET    | `/users/me/title`       | 내 칭호 조회    |
| PUT    | `/users/me/title`       | 칭호 변경      |
| PATCH  | `/users/investmentType` | 투자 성향 변경   |

#### 학습 (Learning)

| Method | Endpoint                 | 설명         |
| ------ | ------------------------ | ---------- |
| GET    | `/quizzes/daily`         | 오늘의 퀴즈 조회  |
| POST   | `/quizzes/daily`         | 퀴즈 정답 제출   |
| GET    | `/quizzes/daily/count`   | 오늘 푼 퀴즈 개수 |
| GET    | `/chapters/base`         | 기본 커리큘럼 조회 |
| GET    | `/chapters/{id}`         | 챕터 상세 조회   |
| GET    | `/chapters/{id}/quizzes` | 챕터 퀴즈 조회   |
| POST   | `/chapters/{id}/quizzes` | 챕터 퀴즈 제출   |
| GET    | `/progress`              | 학습 진행도 조회  |

#### 거래 (Trading)

| Method | Endpoint                        | 설명       |
| ------ | ------------------------------- | -------- |
| GET    | `/stocks/{code}`                | 종목 상세 조회 |
| GET    | `/stocks/{code}/chart/{period}` | 차트 조회    |
| GET    | `/stocks/search`                | 종목 검색    |
| POST   | `/trading/buy`                  | 매수       |
| POST   | `/trading/sell`                 | 매도       |
| GET    | `/accounts/assets`              | 자산 조회    |
| GET    | `/accounts/holdings`            | 보유 주식 조회 |
| GET    | `/accounts/transactions`        | 거래 내역 조회 |

#### 업적 (Achievement)

| Method | Endpoint           | 설명      |
| ------ | ------------------ | ------- |
| GET    | `/achievements/me` | 내 업적 조회 |

#### 커뮤니티 (Community)

| Method | Endpoint                      | 설명        |
| ------ | ----------------------------- | --------- |
| POST   | `/community/rooms`            | 룸 생성      |
| GET    | `/community/rooms`            | 룸 목록 조회   |
| POST   | `/community/rooms/{id}/join`  | 룸 입장      |
| DELETE | `/community/rooms/{id}/leave` | 룸 나가기     |
| POST   | `/chat/send`                  | 채팅 메시지 전송 |
| GET    | `/chat/messages/{roomId}`     | 채팅 메시지 조회 |

#### 랭킹 (Ranking)

| Method | Endpoint                          | 설명       |
| ------ | --------------------------------- | -------- |
| GET    | `/ranking/learningRanking/myRank` | 내 학습 랭킹  |
| GET    | `/ranking/learningRanking/list`   | 학습 랭킹 목록 |
| GET    | `/ranking/profitRanking/myRank`   | 내 수익 랭킹  |
| GET    | `/ranking/profitRanking/list`     | 수익 랭킹 목록 |

---

## 📁 프로젝트 구조

```
amagetdon/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/amagetdon/
│   │   │   │   ├── achievement/          # 업적 도메인
│   │   │   │   │   ├── controller/
│   │   │   │   │   ├── service/
│   │   │   │   │   ├── repository/
│   │   │   │   │   ├── dto/
│   │   │   │   │   └── entity/
│   │   │   │   ├── auth/                 # 인증/인가
│   │   │   │   ├── user/                 # 회원 관리
│   │   │   │   ├── learning/             # 학습 시스템
│   │   │   │   ├── trading/              # 거래 시스템
│   │   │   │   ├── stock/                # 주식 정보
│   │   │   │   ├── community/            # 커뮤니티
│   │   │   │   ├── ranking/              # 랭킹
│   │   │   │   ├── watchlist/            # 관심 종목
│   │   │   │   ├── common/               # 공통 유틸
│   │   │   │   │   ├── config/           # 설정
│   │   │   │   │   ├── exception/        # 예외 처리
│   │   │   │   │   ├── security/         # Security 설정
│   │   │   │   │   └── util/             # 유틸리티
│   │   │   │   └── AmagetdonApplication.java
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-dev.yml
│   │   │       ├── application-prod.yml
│   │   │       └── data.sql
│   │   └── test/
│   ├── build.gradle
│   └── Dockerfile
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── assets/
│   ├── src/
│   │   ├── components/           # 재사용 컴포넌트
│   │   │   ├── common/           # 공통 컴포넌트
│   │   │   ├── layout/           # 레이아웃
│   │   │   └── ...
│   │   ├── pages/                # 페이지 컴포넌트
│   │   │   ├── Auth/             # 로그인/회원가입
│   │   │   ├── Dashboard/        # 대시보드
│   │   │   ├── Learning/         # 학습
│   │   │   ├── Trading/          # 거래
│   │   │   ├── Community/        # 커뮤니티
│   │   │   └── ...
│   │   ├── hooks/                # Custom Hooks
│   │   ├── services/             # API 호출
│   │   ├── store/                # 상태 관리
│   │   ├── utils/                # 유틸리티
│   │   ├── styles/               # 스타일
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
│
├── fastapi-server/               # AI 서버
│   ├── app/
│   │   ├── main.py
│   │   ├── models/               # AI 모델
│   │   ├── services/             # 비즈니스 로직
│   │   └── utils/
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/                         # 문서
│   ├── API_명세서.md
│   ├── 기능명세서.md
│   ├── 기획서.md
│   ├── ERD.png
│   └── 회고록.md
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 📱 주요 화면

### 1. 랜딩 페이지

![](C:\Users\SSAFY\Desktop\src\img\landing_page_05.gif)

- 서비스 소개
- 주요 기능 안내
- 회원가입/로그인 유도

### 2. 메인 대시보드

<img title="" src="file:///C:/Users/SSAFY/Desktop/src/img/dash_board_01.gif" alt="" width="800">

- 오늘의 학습 현황
- 자산 요약
- 최근 업적
- 빠른 액션 버튼

### 3. 학습 커리큘럼

<img title="" src="file:///C:/Users/SSAFY/Desktop/src/img/learning_curriculum_01.gif" alt="" width="800">

- 챕터 진행 상황
- 로드맵 시각화
- 잠금 해제 표시

### 4. 오늘의 퀴즈

<img title="" src="file:///C:/Users/SSAFY/Desktop/src/img/infinite_quiz.gif" alt="" width="800">

- 랜덤 퀴즈
- 정답/오답 피드백
- 보상 표시

### 5. 모의투자

<img title="" src="file:///C:/Users/SSAFY/Desktop/src/img/realtime_stock.gif" alt="" width="800">

- 실시간 차트
- 매수/매도 주문
- 보유 주식 현황

### 6. 업적 시스템

<img title="" src="file:///C:/Users/SSAFY/Desktop/src/img/achievements_01.gif" alt="" width="800">

- 업적 목록
- 달성/미달성 구분
- 달성 조건 표시

### 7. 스터디룸

<img title="" src="file:///C:/Users/SSAFY/Desktop/src/img/community_chat.gif" alt="" width="800">

- 화상 채팅
- 텍스트 채팅
- 멤버 목록

### 8. 랭킹

<img title="" src="file:///C:/Users/SSAFY/Desktop/src/img/ranking_01.gif" alt="" width="800">

- 학습 랭킹
- 수익 랭킹
- 내 순위 하이라이트

---

## 💻 개발 가이드

### 코드 컨벤션

우리 팀은 **Google Java Style Guide**와 **Airbnb JavaScript Style Guide**를 기반으로 합니다.

#### Java/Spring Boot

**네이밍**

```java
// 클래스: PascalCase
public class UserService {}

// 메서드/변수: camelCase
public void getUserInfo() {}
private String userName;

// 상수: UPPER_SNAKE_CASE
public static final int MAX_COUNT = 100;
```

**패키지 구조**

```
com.amagetdon.domain
├── controller
├── service
├── repository
├── dto
└── entity
```

**메서드 네이밍**

```java
// CRUD
getUser()       // 조회
createUser()    // 생성
updateUser()    // 수정
deleteUser()    // 삭제

// Boolean
isActive()      // 상태 확인
hasPermission() // 소유 여부
canAccess()     // 가능 여부
```

**DTO 네이밍**

```java
// Request
UserSignupRequest
UserLoginRequest

// Response
UserResponse
UserListResponse
```

#### JavaScript/React

**컴포넌트 네이밍**

```javascript
// 컴포넌트: PascalCase
function UserProfile() {}

// 변수/함수: camelCase
const userName = 'John';
function getUserInfo() {}

// 상수: UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:8080';
```

**파일 구조**

```javascript
// 컴포넌트
import React from 'react';
import PropTypes from 'prop-types';

const UserCard = ({ user }) => {
  // Hooks
  const [isLoading, setIsLoading] = useState(false);

  // Event Handlers
  const handleClick = () => {};

  // Render
  return <div>{user.name}</div>;
};

UserCard.propTypes = {
  user: PropTypes.object.isRequired
};

export default UserCard;
```

### Git 컨벤션

#### 브랜치 전략

```
main                 # 프로덕션 배포
├── feature/user-auth
├── feature/trading-system
├── fix/quiz-bug
└── hotfix/security-patch
```

**브랜치 네이밍**

- `feature/기능명`: 새로운 기능 개발
- `fix/버그명`: 버그 수정
- `hotfix/이슈명`: 긴급 수정
- `refactor/대상`: 리팩토링
- `docs/문서명`: 문서 작업

#### 커밋 메시지

```
#issue <type>(<scope>): <subject>
```

**Type**

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `refactor`: 리팩토링
- `style`: 코드 포맷팅
- `docs`: 문서 수정
- `test`: 테스트 코드
- `chore`: 빌드, 설정 변경

**예시**

```bash
PJT-15 feat(auth): JWT 토큰 인증 구현
```

### 코드 리뷰

**리뷰어 체크리스트**

- [ ] 코드 컨벤션 준수
- [ ] 테스트 코드 작성
- [ ] 에러 핸들링
- [ ] 보안 취약점 확인
- [ ] 성능 고려
- [ ] 문서화

---

### 🚢 배포

### 아키텍처

```
Internet
    │
    ▼
┌──────────────────────────────────────────────┐
│                EC2 Instance                  │
│  (Docker Compose - host network mode)        │
│                                              │
│  ┌────────┐                                  │
│  │ Nginx  │ :80 (→301 HTTPS), :443           │
│  └───┬────┘                                  │
│      │                                       │
│      ├─── / ──────────► Frontend (:3000)     │
│      ├─── /api ───────► Backend  (:8080)     │
│      └─── /quiz ──────► FastAPI  (:8000)     │
│                                              │
│  ┌────────────┐  ┌───────┐  ┌───────────┐    │
│  │ Collector  │  │ MySQL │  │   Redis   │    │
│  │ (주식 수집) │  │ :3306 │  │   :6379   │    │
│  └───────────┘  └───────┘  └───────────┘    │
└──────────────────────────────────────────────┘
```

### 사전 준비

**3. SSL 인증서 발급 (Let's Encrypt)**

```bash
# Certbot 설치
sudo apt-get install -y certbot

# 인증서 발급
sudo certbot certonly --standalone -d your-domain.com
```

> Self-signed 인증서가 필요한 경우, Nginx 컨테이너가 자동으로 생성합니다.

### 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성합니다.

```bash
# .env
# Database
DB_PASSWORD=your-db-password

# JWT
JWT_SECRET=your-256-bit-secret

# Email (SMTP)
MY_EMAIL_PASSWORD=your-email-app-password

# OAuth / Redirect
REDIRECT_URL=https://your-domain.com

# OpenVidu
OPENVIDU_URL=https://your-openvidu-url
OPENVIDU_SECRET=your-openvidu-secret

# 한국투자증권 API (Collector)
STOCK_API_KEY=your-stock-api-key
STOCK_API_SECRET=your-stock-api-secret
CANDLE_API_KEY=your-candle-api-key
CANDLE_API_SECRET=your-candle-api-secret
KIS_HTS_ID=your-hts-id

# Kakao (Frontend)
VITE_KAKAO_JS_KEY=your-kakao-js-key

# Gemini API (FastAPI)
GMS_API_KEY=your-gemini-api-key

# Domain
DOMAIN=your-domain.com
```

### Docker Compose로 배포

**docker-compose.yaml**

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: amagetdon-mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: amagetdon
      TZ: Asia/Seoul
    volumes:
      - mysql-data:/var/lib/mysql
      - ./AMAGETDON-BE/data/chapters.csv:/var/lib/mysql-files/chapters.csv
      - ./AMAGETDON-BE/data/quizzes.csv:/var/lib/mysql-files/quizzes.csv
      - ./AMAGETDON-BE/data/quiz_choices.csv:/var/lib/mysql-files/quiz_choices.csv
      - ./AMAGETDON-BE/data/survey_questions.csv:/var/lib/mysql-files/survey_questions.csv
      - ./AMAGETDON-BE/data/achievements.csv:/var/lib/mysql-files/achievements.csv
      - ./AMAGETDON-BE/init-scripts/01-schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./AMAGETDON-BE/init-scripts/02-load-data.sql:/docker-entrypoint-initdb.d/02-load-data.sql
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --secure-file-priv=/var/lib/mysql-files
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    network_mode: host
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: amagetdon-redis
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    network_mode: host
    restart: unless-stopped

  backend:
    build:
      context: ./AMAGETDON-BE
      dockerfile: Dockerfile
    container_name: amagetdon-backend
    environment:
      - DB_HOST=localhost
      - DB_PORT=3306
      - DB_USER=root
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=amagetdon
      - REDIS_HOST=localhost
      - REDIS_PORT=6379
      - JWT_SECRET=${JWT_SECRET}
      - MY_EMAIL_PASSWORD=${MY_EMAIL_PASSWORD}
      - REDIRECT_URL=${REDIRECT_URL}
      - OPENVIDU_URL=${OPENVIDU_URL}
      - OPENVIDU_SECRET=${OPENVIDU_SECRET}
      - TZ=Asia/Seoul
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    network_mode: host
    restart: unless-stopped

  fastapi:
    build:
      context: ./AMAGETDON-FastAPI
      dockerfile: Dockerfile
    container_name: amagetdon-fastapi
    environment:
      - MYSQL_HOST=localhost
      - MYSQL_PORT=3306
      - MYSQL_USER=root
      - MYSQL_PASSWORD=${DB_PASSWORD}
      - MYSQL_DATABASE=amagetdon
      - GMS_API_KEY=${GMS_API_KEY}
      - TZ=Asia/Seoul
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    network_mode: host
    restart: unless-stopped

  collector:
    build:
      context: ./AMAGETDON-Collector
      dockerfile: Dockerfile
    container_name: amagetdon-collector
    environment:
      - DB_HOST=localhost
      - DB_PORT=3306
      - DB_USER=root
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=amagetdon
      - STOCK_API_KEY=${STOCK_API_KEY}
      - STOCK_API_SECRET=${STOCK_API_SECRET}
      - CANDLE_API_KEY=${CANDLE_API_KEY}
      - CANDLE_API_SECRET=${CANDLE_API_SECRET}
      - KIS_HTS_ID=${KIS_HTS_ID}
      - TZ=Asia/Seoul
    network_mode: host
    restart: unless-stopped

  frontend:
    build:
      context: ./AMAGETDON-FE
      dockerfile: Dockerfile
    container_name: amagetdon-frontend
    environment:
      - VITE_KAKAO_JS_KEY=${VITE_KAKAO_JS_KEY}
      - REDIRECT_URL=${REDIRECT_URL}
    network_mode: host
    restart: unless-stopped

  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    container_name: amagetdon-nginx
    environment:
      - SERVER_DOMAIN=${DOMAIN:-localhost}
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot
    depends_on:
      - frontend
      - backend
      - fastapi
    network_mode: host
    restart: unless-stopped

volumes:
  mysql-data:
  redis-data:
```

### 배포 실행

```bash
# 1. infra-fix 브랜치를 바로 클론
git clone -b feat/S14P11A207-237-infra-fix https://lab.ssafy.com/s14-webmobile1-sub1/S14P11A207.git
cd S14P11A207

# 2. .env 파일 작성
vi .env

# 3. 전체 서비스 빌드 및 실행
docker-compose up -d --build

# 4. 로그 확인
docker-compose logs -f

# 5. 개별 서비스 로그 확인
docker-compose logs -f backend
docker-compose logs -f fastapi
```

### Nginx 리버스 프록시 설정

모든 서비스는 `network_mode: host`로 동작하며, Nginx가 리버스 프록시 역할을 합니다.

| 경로        | 프록시 대상           | 설명              |
| --------- | ---------------- | --------------- |
| `/`       | `localhost:3000` | React 프론트엔드     |
| `/api`    | `localhost:8080` | Spring Boot 백엔드 |
| `/quiz`   | `localhost:8000` | FastAPI 퀴즈 서비스  |
| `/health` | -                | 헬스 체크 (200 응답)  |

- HTTP(:80) 요청은 자동으로 HTTPS(:443)로 리다이렉트됩니다.
- SSL 인증서가 없으면 self-signed 인증서가 자동 생성됩니다.
- Let's Encrypt 인증서 갱신을 위한 `/.well-known/acme-challenge/` 경로가 설정되어 있습니다.

### 운영 명령어

```bash
# 서비스 상태 확인
docker-compose ps

# 서비스 재시작
docker-compose restart backend

# 특정 서비스만 재빌드
docker-compose up -d --build backend

# 전체 서비스 중지
docker-compose down

# 볼륨 포함 전체 삭제 (DB 데이터 초기화)
docker-compose down -v
```

---

## 📊 프로젝트 통계

| 항목         | 수치       |
| ---------- | -------- |
| 개발 기간      | 35일 (5주) |
| 팀원 수       | 6명       |
| 총 커밋 수     | 939개     |
| API 엔드포인트  | 58개      |
| 데이터베이스 테이블 | 24개      |
| 챕터 수       | 26개      |
| 퀴즈 수       | 980개     |
| 업적 수       | 18개      |
| 기술 스택      | 13개      |
| MVP 달성률    | 100%     |

### 개발 일정

```
Week 1 (01.06-01.12): 기획 및 설계
  - 요구사항 정의
  - 기술 스택 선정
  - ERD 설계
  - API 명세서 작성

Week 2 (01.13-01.19): 기본 기능 개발
  - 인증/회원 관리
  - 학습 시스템 기본 구조
  - 거래 시스템 기본 구조

Week 3 (01.20-01.26): 핵심 기능 개발
  - 무한 퀴즈 시스템
  - 모의투자 완성
  - 업적 시스템

Week 4 (01.27-02.02): 추가 기능 개발
  - 커뮤니티 (OpenVidu)
  - 랭킹 시스템
  - AI 성향 분석

Week 5 (02.03-02.09): 테스트 및 배포
  - 통합 테스트
  - 버그 수정
  - 배포 및 문서화
```

### 도메인별 코드 분포

| 도메인           | 라인 수 (예상) | 비율  |
| ------------- | --------- | --- |
| Learning      | ~8,000    | 30% |
| Trading/Stock | ~6,000    | 23% |
| Achievement   | ~4,000    | 15% |
| Community     | ~3,500    | 13% |
| Auth/User     | ~3,000    | 11% |
| Ranking       | ~1,500    | 6%  |
| Common        | ~500      | 2%  |

---

## 👥 팀 소개

<table>
 <tr>
 <td align="center">
 <a href="https://github.com/kimgem2437">
 <img src="https://github.com/kimgem2437.png" width="100px;" alt=""/><br />
 <sub><b>김민재</b></sub>
 </a><br />
 <sub>팀장 / 풀스택</sub><br />
 <sub>커뮤니티, 랭킹</sub>
 </td>
 <td align="center">
 <a href="https://github.com/mingyukang5420">
 <img src="https://github.com/mingyukang5420.png" width="100px;" alt=""/><br />
 <sub><b>강민규</b></sub>
 </a><br />
 <sub>풀스택</sub><br />
 <sub>퀴즈, 오답노트, AI</sub>
 </td>
 <td align="center">
 <a href="https://github.com/skyla1005">
 <img src="https://github.com/skyla1005.png" width="100px;" alt=""/><br />
 <sub><b>류수정</b></sub>
 </a><br />
 <sub>풀스택</sub><br />
 <sub>유저, 인프라, 발표</sub>
 </td>
 </tr>
 <tr>
 <td align="center">
 <a href="https://github.com/unji09">
 <img src="https://github.com/unji09.png" width="100px;" alt=""/><br />
 <sub><b>정은지</b></sub>
 </a><br />
 <sub>백엔드</sub><br />
 <sub>한국투자증권 API, 인프라</sub>
 </td>
 <td align="center">
 <a href="https://github.com/ze-zeh">
 <img src="https://github.com/ze-zeh.png" width="100px;" alt=""/><br />
 <sub><b>조재훈</b></sub>
 </a><br />
 <sub>백엔드</sub><br />
 <sub>거래 시스템</sub>
 </td>
 <td align="center">
 <a href="https://github.com/jiwon0226">
 <img src="https://github.com/jiwon0226.png" width="100px;" alt=""/><br />
 <sub><b>채지원</b></sub>
 </a><br />
 <sub>풀스택</sub><br />
 <sub>학습, 업적, UX개</sub>
 </td>
 </tr>
</table>

### 역할 상세

**김민재 (팀장/풀스택)**

- 프로젝트 총괄 및 일정 관리
- 커뮤니티 기능 (OpenVidu 연동)
- 랭킹 시스템 (학습/수익)
- 스크럼 마스터

**강민규 (풀스택)**

- 데이터 생성 (980개 퀴즈)
- 무한 랜덤 퀴즈
- AI 퀴즈 생성 (FastAPI)
- AI 성향 분석 모델

**류수정 (풀스택)**

- 회원 관리 (회원가입/로그인)
- 카카오 소셜 로그인
- AWS 인프라 구축
- 발표 자료 준비와 발표

**정은지 (백엔드)**

- 한국투자증권 API 연동
- 실시간 시세 처리
- 차트 데이터 수집
- AWS 인프라 구축

**조재훈 (백엔드)**

- 거래 시스템 (매수/매도)
- 수수료 계산 로직
- 평균 단가 재계산
- 거래 내역 관리

**채지원 (풀스택)**

- 학습 시스템 (커리큘럼)
- 업적 시스템
- 챕터 퀴즈
- 진행도 관리

---

## 📚 참고 자료

### 공식 문서

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Redis Documentation](https://redis.io/documentation)
- [한국투자증권 API](https://apiportal.koreainvestment.com/)
- [OpenVidu Documentation](https://docs.openvidu.io/)
- [Kakao Developers REST API](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)

---

## ⭐️ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=your-org/amagetdon&type=Date)](https://star-history.com/#your-org/amagetdon&Date)

---

### 🙏 감사합니다!

이 프로젝트가 도움이 되셨다면 ⭐️ Star를 눌러주세요!

**Made with ❤️ by AmaGetDon Team**

[⬆ 맨 위로 이동](# 목차)
