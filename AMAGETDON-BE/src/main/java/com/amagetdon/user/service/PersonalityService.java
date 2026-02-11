package com.amagetdon.user.service;

import com.amagetdon.common.config.FastApiConfig;
import com.amagetdon.user.dto.request.PersonalityAnalyzeRequest;
import com.amagetdon.user.dto.response.PersonalityAnalyzeResponse;
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
public class PersonalityService {

    private final RestTemplate restTemplate;
    private final FastApiConfig fastApiConfig;

    /**
     * FastAPI를 통한 업적 기반 성향 분석
     *
     * @param userId 사용자 ID
     * @return 성향 분석 결과
     */
    public PersonalityAnalyzeResponse analyzePersonality(Long userId) {
        try {
            // 요청 생성
            PersonalityAnalyzeRequest request = new PersonalityAnalyzeRequest(userId);

            // 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<PersonalityAnalyzeRequest> entity = new HttpEntity<>(request, headers);

            // FastAPI 호출
            String url = fastApiConfig.getFullPersonalityAnalyzeUrl();
            log.info("FastAPI 성향 분석 요청: url={}, userId={}", url, userId);

            ResponseEntity<PersonalityAnalyzeResponse> response = restTemplate.postForEntity(
                    url,
                    entity,
                    PersonalityAnalyzeResponse.class
            );

            PersonalityAnalyzeResponse body = response.getBody();
            log.info("FastAPI 성향 분석 응답: success={}, can_analyze={}, message={}",
                    body != null ? body.getSuccess() : null,
                    body != null ? body.getCanAnalyze() : null,
                    body != null ? body.getMessage() : null);

            if (body == null) {
                log.error("FastAPI 응답이 null입니다");
                throw new RuntimeException("FastAPI 응답이 비어있습니다");
            }

            return body;

        } catch (Exception e) {
            log.error("FastAPI 성향 분석 실패: userId={}", userId, e);
            throw new RuntimeException("성향 분석 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}
