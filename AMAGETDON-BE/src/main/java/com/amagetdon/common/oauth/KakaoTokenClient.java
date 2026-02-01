package com.amagetdon.common.oauth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class KakaoTokenClient {

    private final RestTemplate restTemplate = new RestTemplate();
    private final KakaoProperties kakaoProperties;

    public String getAccessToken(String code) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", kakaoProperties.getRestApiKey());
        params.add("redirect_uri", kakaoProperties.getRedirectUri());
        params.add("code", code);

        if (kakaoProperties.getClientSecret() != null) {
            params.add("client_secret", kakaoProperties.getClientSecret());
        }

        HttpEntity<MultiValueMap<String, String>> request =
                new HttpEntity<>(params, headers);

        ResponseEntity<Map> response =
                restTemplate.postForEntity(
                        "https://kauth.kakao.com/oauth/token",
                        request,
                        Map.class
                );

        Map body = response.getBody();

        if (body == null || body.get("access_token") == null) {
            throw new IllegalStateException("카카오 access token 발급 실패: " + body);
        }

        return (String) body.get("access_token");
    }

}
