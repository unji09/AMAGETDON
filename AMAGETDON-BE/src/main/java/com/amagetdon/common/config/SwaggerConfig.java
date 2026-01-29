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
                                
                                ### 인증 방법 (TODO: JWT 도입 예정)
                                현재는 `User-Id` 헤더로 임시 인증 중입니다.
                                
                                1. 각 API의 `User-Id` 헤더에 사용자 ID 입력
                                2. JWT 도입 후: 우측 상단 **Authorize** 버튼으로 토큰 인증
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
                                        .description("JWT Access Token을 입력하세요 (Bearer 제외)")
                        )
                )
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName));
    }
}