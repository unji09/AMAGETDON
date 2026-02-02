package com.amagetdon.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("AMAGETDON API")
                        .version("1.0.0")
                        .description("""
                                ## AMAGETDON 주식 투자 교육 플랫폼 API
                                
                                ### 인증 방법 (JWT 토큰 인증)
                                모든 API는 JWT 토큰 기반 인증을 사용합니다.
                                
                                **인증 절차:**
                                1. 로그인 API (`POST /auth/login`)를 통해 JWT 토큰 발급
                                2. 우측 상단 **🔓 Authorize** 버튼 클릭
                                3. Access Token을 입력 (Bearer 접두사 자동 추가됨)
                                4. 인증 완료 후 모든 API 사용 가능
                                
                                **토큰 예시:**
```
                                eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTYzOTk4NzY1NH0...
```
                                
                                **주의사항:**
                                - 토큰 입력 시 `Bearer` 접두사는 제외하고 입력하세요
                                - 토큰이 만료된 경우 재로그인이 필요합니다
                                """)
                )
                .servers(List.of(
                        new Server().url("http://localhost:8080/api/v1").description("로컬 서버"),
                        new Server().url("https://api.amagetdon.com/api/v1").description("운영 서버")
                ))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .in(SecurityScheme.In.HEADER)
                                        .description("JWT Access Token을 입력하세요 (Bearer 접두사 제외)")
                        )
                )
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName));
    }
}