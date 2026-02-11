package com.amagetdon.learning.service;

import com.amagetdon.common.config.FastApiConfig;
import com.amagetdon.learning.dto.fastapi.QuizGenerateRequest;
import com.amagetdon.learning.dto.fastapi.QuizGenerateResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class FastApiService {

    private final RestTemplate restTemplate;
    private final FastApiConfig fastApiConfig;

    /**
     * FastAPI에 퀴즈 생성 요청
     * 비동기로 동작 (FastAPI가 MySQL에 직접 저장)
     */
    public QuizGenerateResponse requestQuizGeneration(
            Integer count,
            String difficulty,
            String quizType
    ) {
        try {
            // 요청 생성
            QuizGenerateRequest request = new QuizGenerateRequest(count, difficulty, quizType);

            // 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<QuizGenerateRequest> entity = new HttpEntity<>(request, headers);

            // FastAPI 호출
            String url = fastApiConfig.getFullGenerateUrl();
            log.info("FastAPI 퀴즈 생성 요청: url={}, request={}", url, request);

            ResponseEntity<QuizGenerateResponse> response = restTemplate.postForEntity(
                    url,
                    entity,
                    QuizGenerateResponse.class
            );

            log.info("FastAPI 퀴즈 생성 응답: {}", response.getBody());
            return response.getBody();

        } catch (Exception e) {
            log.error("FastAPI 퀴즈 생성 실패", e);
            throw new RuntimeException("퀴즈 생성 중 오류가 발생했습니다");
        }
    }

    /**
     * FastAPI에 퀴즈 생성을 비동기로 요청
     * 백그라운드에서 실행되며 결과는 MySQL에 직접 저장됨
     */
    @Async("taskExecutor")
    public void requestQuizGenerationAsync(Integer count, String difficulty, String quizType) {
        try {
            log.info("비동기 퀴즈 생성 요청 시작: count={}, difficulty={}, quizType={}", count, difficulty, quizType);
            requestQuizGeneration(count, difficulty, quizType);
            log.info("비동기 퀴즈 생성 완료");
        } catch (Exception e) {
            log.error("비동기 퀴즈 생성 실패", e);
        }
    }
}