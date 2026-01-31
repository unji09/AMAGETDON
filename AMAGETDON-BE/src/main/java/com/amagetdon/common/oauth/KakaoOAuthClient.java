package com.amagetdon.common.oauth;

import com.amagetdon.common.oauth.dto.response.KakaoUserResponse;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class KakaoOAuthClient {

    private final RestTemplate restTemplate = new RestTemplate();

    public KakaoUserResponse getUserInfo(String accessToken) {

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<KakaoUserResponse> response =
                restTemplate.exchange(
                        "https://kapi.kakao.com/v2/user/me",
                        HttpMethod.GET,
                        request,
                        KakaoUserResponse.class
                );

        KakaoUserResponse body = response.getBody();
        if (body == null) {
            throw new SecurityException("카카오 사용자 정보 조회 실패");
        }

        return body;
    }
}

