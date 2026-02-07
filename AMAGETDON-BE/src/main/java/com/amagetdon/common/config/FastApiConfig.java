package com.amagetdon.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class FastApiConfig {

    @Value("${fastapi.url}")
    private String fastApiUrl;

    @Value("${fastapi.quiz.generate-endpoint}")
    private String generateEndpoint;

    @Value("${fastapi.personality.analyze-endpoint}")
    private String personalityAnalyzeEndpoint;

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    public String getFastApiUrl() {
        return fastApiUrl;
    }

    public String getGenerateEndpoint() {
        return generateEndpoint;
    }

    public String getFullGenerateUrl() {
        return fastApiUrl + generateEndpoint;
    }

    public String getPersonalityAnalyzeEndpoint() {
        return personalityAnalyzeEndpoint;
    }

    public String getFullPersonalityAnalyzeUrl() {
        return fastApiUrl + personalityAnalyzeEndpoint;
    }
}