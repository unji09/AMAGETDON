package com.amagetdon.common.oauth.controller.swagger;

import com.amagetdon.auth.dto.response.AuthLoginResponse;
import com.amagetdon.common.oauth.dto.request.OAuthLoginRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;

@Tag(name = "소셜 로그인", description = "소셜 로그인(OAuth) API")
public interface OAuthControllerSwagger {

    @Operation(
            summary = "카카오 소셜 로그인",
            description = """
                    카카오 OAuth Access Token을 이용해 로그인합니다.
                    최초 로그인 시 자동 회원가입이 수행됩니다.
                    
                    성공 시 Access Token은 응답 바디로 반환되며,
                    Refresh Token은 HttpOnly Cookie로 설정됩니다.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "로그인 성공",
                    content = @Content(
                            schema = @Schema(implementation = AuthLoginResponse.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                      "tokenType": "Bearer",
                                      "expiration": 3600,
                                      "firstLogin": false
                                    }
                                    """)
                    )
            ),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "401", description = "OAuth 토큰이 유효하지 않음")
    })
    ResponseEntity<AuthLoginResponse> kakaoOAuthlogin(
            @Parameter(description = "OAuth 로그인 요청 정보", required = true)
            OAuthLoginRequest request
    );
}
