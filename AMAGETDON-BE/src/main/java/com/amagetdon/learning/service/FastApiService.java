package com.amagetdon.learning.service;

import com.amagetdon.learning.config.FastApiConfig;
import com.amagetdon.learning.dto.fastapi.QuizGenerateRequest;
import com.amagetdon.learning.dto.fastapi.QuizGenerateResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
}