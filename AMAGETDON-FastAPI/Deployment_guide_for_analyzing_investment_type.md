# 성향 분석 시스템 배포 가이드

## 📋 개요

업적 기반 투자 성향 분석 시스템을 운영 서버에 배포하는 가이드입니다.

---

## 🎯 배포 전 준비물 체크리스트

- [ ] `personality_model.pkl` (학습된 ML 모델 파일)
- [ ] FastAPI 소스코드 (personality_router.py, personality_service.py, personality_dto.py)
- [ ] Spring Boot 소스코드 (DTO, Controller, Service 수정사항)
- [ ] 업데이트된 requirements.txt
- [ ] EC2 서버 접속 권한

---

## 📦 1단계: FastAPI 파일 배포

### 1-1. 디렉토리 구조 확인

SSH로 EC2 서버 접속 후 FastAPI 프로젝트 디렉토리로 이동:

```bash
cd /path/to/AMAGETDON-FastAPI
```

### 1-2. ml 디렉토리 생성

```bash
mkdir -p ml
```

### 1-3. 파일 업로드

**로컬 → 서버로 파일 전송 (로컬 터미널에서 실행):**

```bash
# ML 모델 파일
scp personality_model.pkl ec2-user@[EC2_IP]:/path/to/AMAGETDON-FastAPI/ml/

# 학습 스크립트 (선택사항)
scp train_model.py ec2-user@[EC2_IP]:/path/to/AMAGETDON-FastAPI/ml/
scp synthetic_achievement_data.csv ec2-user@[EC2_IP]:/path/to/AMAGETDON-FastAPI/ml/
```

**또는 FileZilla, WinSCP 등 FTP 클라이언트 사용**

### 1-4. FastAPI 소스코드 추가

```bash
# app/api/ 디렉토리
cd app/api
# personality_router.py 파일 생성 및 코드 붙여넣기
vi personality_router.py

# app/services/ 디렉토리
cd ../services
# personality_service.py 파일 생성 및 코드 붙여넣기
vi personality_service.py

# models/ 디렉토리
cd ../../models
# personality_dto.py 파일 생성 및 코드 붙여넣기
vi personality_dto.py
```

**또는 Git을 사용하는 경우:**

```bash
git pull origin main
```

### 1-5. main.py 수정

```bash
vi main.py
```

**추가할 내용:**

```python
# 라우터 import 추가
from app.api import quiz_router, personality_router

# 라우터 등록 추가
app.include_router(personality_router.router)
```

### 1-6. requirements.txt 교체

```bash
vi requirements.txt
```

**전체 내용을 다음으로 교체:**

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
pymysql==1.1.0
sqlalchemy==2.0.25
python-dotenv==1.0.0
pydantic==2.5.3
pydantic-settings==2.1.0
requests==2.31.0
xgboost==2.0.3
scikit-learn==1.4.0
joblib==1.3.2
numpy==1.26.3
redis==5.0.1
```

---

## 🐳 2단계: Docker 이미지 재빌드

### 2-1. Dockerfile 확인 (수정 불필요)

현재 Dockerfile이 requirements.txt를 사용하고 있다면 추가 수정 불필요합니다.

**확인사항:**

```dockerfile
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
```

### 2-2. Docker Compose로 재배포

```bash
cd /path/to/docker-compose.yaml 위치

# 기존 컨테이너 중지 및 제거
docker-compose down

# 이미지 재빌드 및 컨테이너 실행
docker-compose up --build -d
```

**FastAPI만 재시작하려면:**

```bash
docker-compose restart fastapi
```

### 2-3. 배포 확인

```bash
# 컨테이너 실행 상태 확인
docker-compose ps

# FastAPI 로그 확인
docker-compose logs -f fastapi
```

**정상 실행 시 로그:**

```
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## ☕ 3단계: Spring Boot 파일 배포

### 3-1. Spring Boot 프로젝트로 이동

```bash
cd /path/to/AMAGETDON-BE
```

### 3-2. 파일 추가

**user/dto/ 디렉토리:**

```bash
cd src/main/java/com/amagetdon/user/dto

# UpdateInvestmentTypeRequest.java 생성
vi UpdateInvestmentTypeRequest.java

# UpdateInvestmentTypeResponse.java 생성
vi UpdateInvestmentTypeResponse.java
```

### 3-3. 파일 수정

**user/service/UserService.java:**

```bash
vi src/main/java/com/amagetdon/user/service/UserService.java
```

**메서드 추가:**

```java
@Transactional
public void updateInvestmentType(Long userId, InvestmentType investmentType) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException(ErrorCode.USER_NOT_FOUND_SIMPLE.getMessage()));

    user.updateInvestmentType(investmentType);
}
```

**user/controller/UserController.java:**

```bash
vi src/main/java/com/amagetdon/user/controller/UserController.java
```

**엔드포인트 추가:**

```java
@PatchMapping("/{userId}/investmentType")
public ResponseEntity<UpdateInvestmentTypeResponse> updateInvestmentType(
        @PathVariable Long userId,
        @Valid @RequestBody UpdateInvestmentTypeRequest request
) {
    userService.updateInvestmentType(userId, request.getInvestmentType());

    return ResponseEntity.ok(
            new UpdateInvestmentTypeResponse(true, request.getInvestmentType())
    );
}
```

**achievement/service/AchievementService.java:**

```bash
vi src/main/java/com/amagetdon/achievement/service/AchievementService.java
```

**의존성 추가:**

```java
private final StringRedisTemplate redisTemplate;  // 추가
```

**checkAndAwardAchievements 메서드 마지막에 추가:**

```java
// Redis Pub/Sub 이벤트 발행
redisTemplate.convertAndSend("achievement:granted", userId.toString());
```

### 3-4. Gradle 빌드

```bash
# 빌드
./gradlew clean build

# 또는 테스트 제외
./gradlew clean build -x test
```

### 3-5. Spring Boot 재시작

**Docker를 사용하는 경우:**

```bash
docker-compose restart spring
```

**JAR를 직접 실행하는 경우:**

```bash
# 기존 프로세스 종료
pkill -f amagetdon

# 새 JAR 실행
nohup java -jar build/libs/amagetdon-0.0.1-SNAPSHOT.jar &
```

---

## ✅ 4단계: 배포 검증

### 4-1. FastAPI 헬스 체크

```bash
curl http://localhost:8001/health
curl http://localhost:8001/api/personality/health
```

**예상 응답:**

```json
{"status":"healthy"}
{"status":"ok","service":"personality-analysis"}
```

### 4-2. Spring Boot 헬스 체크

```bash
curl http://localhost:8080/actuator/health
```

### 4-3. 성향 분석 API 테스트

**FastAPI:**

```bash
curl -X POST http://localhost:8000/api/personality/analyze \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1}'
```

**예상 응답 (업적 5개 미만):**

```json
{
  "success": false,
  "can_analyze": false,
  "achievement_count": 3,
  "message": "최소 5개 이상의 업적이 필요합니다"
}
```

**예상 응답 (업적 5개 이상):**

```json
{
  "success": true,
  "can_analyze": true,
  "achievement_count": 7,
  "initial_type": "STABLE",
  "predicted_type": "AGGRESSIVE",
  "confidence": 0.85,
  "probabilities": {
    "AGGRESSIVE": 0.85,
    "STABLE": 0.10,
    "NEUTRAL": 0.05
  }
}
```

**Spring Boot:**

```bash
curl -X PATCH http://localhost:8080/api/v1/users/1/investmentType \
  -H "Content-Type: application/json" \
  -d '{"investmentType": "AGGRESSIVE"}'
```

**예상 응답:**

```json
{
  "success": true,
  "updatedType": "AGGRESSIVE"
}
```

### 4-4. Redis Pub/Sub 테스트

**터미널 1 (구독):**

```bash
redis-cli
SUBSCRIBE achievement:granted
```

**터미널 2 (업적 달성 API 호출):**

업적 달성 API를 호출하면 터미널 1에 메시지가 나타나야 합니다.

**예상 출력:**

```
1) "message"
2) "achievement:granted"
3) "1"
```

---

## 🔧 5단계: 트러블슈팅

### 문제 1: 모델 파일을 찾을 수 없음

**에러:**

```
FileNotFoundError: 모델 파일을 찾을 수 없습니다: ml/personality_model.pkl
```

**해결:**

```bash
# 파일 존재 확인
ls -la /path/to/AMAGETDON-FastAPI/ml/personality_model.pkl

# 권한 확인
chmod 644 ml/personality_model.pkl
```

### 문제 2: 패키지 설치 실패

**에러:**

```
ERROR: Could not find a version that satisfies the requirement xgboost
```

**해결:**

```bash
# Docker 컨테이너 내부 접속
docker exec -it fastapi-container bash

# 수동 설치
pip install xgboost scikit-learn joblib
```

### 문제 3: Redis 연결 실패

**에러:**

```
redis.exceptions.ConnectionError: Error connecting to Redis
```

**해결:**

```bash
# Redis 컨테이너 상태 확인
docker-compose ps redis

# Redis 재시작
docker-compose restart redis

# application.yml에서 Redis 설정 확인
data:
  redis:
    host: redis  # Docker 네트워크 내에서는 컨테이너 이름
    port: 6379
```

### 문제 4: Spring StringRedisTemplate 빈 없음

**에러:**

```
NoSuchBeanDefinitionException: No qualifying bean of type 'StringRedisTemplate'
```

**해결:**

RedisConfig.java에 빈 추가:

```java
@Bean
public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
    return new StringRedisTemplate(connectionFactory);
}
```

### 문제 5: MySQL 연결 실패

**에러:**

```
sqlalchemy.exc.OperationalError: Can't connect to MySQL server
```

**해결:**

FastAPI의 database.py 설정 확인:

```python
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:password@mysql:3306/amagetdon"
```

Docker 네트워크에서는 `localhost` 대신 `mysql` (컨테이너 이름) 사용

---

## 📊 6단계: 모니터링

### 로그 확인

**FastAPI:**

```bash
docker-compose logs -f fastapi
```

**Spring Boot:**

```bash
docker-compose logs -f spring
```

**특정 시간 이후 로그:**

```bash
docker-compose logs --since 10m fastapi
```

### 리소스 사용량 확인

```bash
docker stats
```

---

## 🎉 배포 완료 체크리스트

- [ ] FastAPI 컨테이너 정상 실행
- [ ] Spring Boot 컨테이너 정상 실행
- [ ] `/api/personality/health` 응답 정상
- [ ] 성향 분석 API 테스트 성공
- [ ] 성향 변경 API 테스트 성공
- [ ] Redis Pub/Sub 메시지 수신 확인
- [ ] 로그에 에러 없음

---

## 📞 문제 발생 시

1. 로그 확인 (`docker-compose logs`)
2. 컨테이너 상태 확인 (`docker-compose ps`)
3. 트러블슈팅 섹션 참고
4. 필요시 문서 작성자에게 문의


