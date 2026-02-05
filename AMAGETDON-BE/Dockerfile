FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Gradle Wrapper 복사
COPY gradlew .
COPY gradle gradle

# 실행 권한 부여
RUN chmod +x ./gradlew

# 빌드 설정 파일 복사
COPY build.gradle .
COPY settings.gradle .

# 의존성 다운로드 (캐싱)
RUN ./gradlew dependencies --no-daemon || true

# 소스 코드 복사
COPY src src

# 빌드 (테스트 제외)
RUN ./gradlew clean build -x test --no-daemon

# 생성된 JAR 파일을 app.jar로 이름 변경
RUN mv build/libs/amagetdonbe-0.0.1-SNAPSHOT.jar build/libs/app.jar

EXPOSE 8080

# JVM 옵션
ENV JAVA_OPTS="-Xmx512m -Xms256m"

CMD ["sh", "-c", "java ${JAVA_OPTS} -jar build/libs/app.jar"]