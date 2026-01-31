package com.amagetdon.auth.controller;

import com.amagetdon.auth.dto.request.AuthLoginRequest;
import com.amagetdon.auth.dto.request.AuthSignupRequest;
import com.amagetdon.auth.dto.response.AuthLoginResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;

@Tag(name = "인증 / 인가", description = "인증 / 인가 API")
public interface AuthControllerSwagger {

    @Operation(
            summary = "로그인",
            description = """
                    이메일과 비밀번호로 로그인합니다.
                    성공 시 Access Token을 응답 바디로 반환하며,
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
            @ApiResponse(responseCode = "400", description = "요청 값 오류"),
            @ApiResponse(responseCode = "401", description = "이메일 또는 비밀번호 불일치")
    })
    ResponseEntity<AuthLoginResponse> login(
            @Parameter(description = "로그인 요청 정보", required = true)
            AuthLoginRequest request
    );

    @Operation(
            summary = "회원가입",
            description = """
                    회원가입을 진행합니다.
                    가입 완료 후 자동으로 로그인 처리되며,
                    Access Token은 응답 바디로,
                    Refresh Token은 HttpOnly Cookie로 설정됩니다.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "회원가입 성공",
                    content = @Content(
                            schema = @Schema(implementation = AuthLoginResponse.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                      "tokenType": "Bearer",
                                      "expiration": 3600,
                                      "firstLogin": true
                                    }
                                    """)
                    )
            ),
            @ApiResponse(responseCode = "400", description = "이미 존재하는 계정")
    })
    ResponseEntity<AuthLoginResponse> signup(
            @Parameter(description = "회원가입 요청 정보", required = true)
            AuthSignupRequest request
    );

    @Operation(
            summary = "로그아웃",
            description = """
                    로그아웃을 수행합니다.
                    서버에 저장된 Refresh Token을 삭제하고,
                    클라이언트의 Refresh Token 쿠키를 만료 처리합니다.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "로그아웃 성공",
                    content = @Content(
                            examples = @ExampleObject(value = "로그아웃 되었습니다.")
                    )
            )
    })
    ResponseEntity<String> logout(
            @Parameter(
                    description = "Refresh Token (HttpOnly Cookie)",
                    example = "refreshToken"
            )
            String refreshToken
    );

    @Operation(
            summary = "회원 탈퇴",
            description = """
                    인증된 사용자의 회원 탈퇴를 처리합니다.
                    Refresh Token을 기준으로 사용자를 식별합니다.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "회원 탈퇴 성공",
                    content = @Content(
                            examples = @ExampleObject(value = "회원 탈퇴가 완료되었습니다.")
                    )
            ),
            @ApiResponse(responseCode = "400", description = "인증 정보 없음"),
            @ApiResponse(responseCode = "401", description = "토큰 만료 또는 위조")
    })
    ResponseEntity<String> withdraw(
            @Parameter(
                    description = "Refresh Token (HttpOnly Cookie)",
                    example = "refreshToken"
            )
            String refreshToken
    );

    @Operation(
            summary = "Access Token 재발급",
            description = """
                    Refresh Token을 검증한 뒤
                    새로운 Access Token과 Refresh Token을 발급합니다.
                    (RTR: Refresh Token Rotation 적용)
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "재발급 성공",
                    content = @Content(
                            schema = @Schema(implementation = AuthLoginResponse.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "accessToken": "new-access-token",
                                      "tokenType": "Bearer",
                                      "expiration": 3600,
                                      "firstLogin": false
                                    }
                                    """)
                    )
            ),
            @ApiResponse(responseCode = "401", description = "Refresh Token 만료 또는 위조")
    })
    ResponseEntity<AuthLoginResponse> refresh(
            @Parameter(
                    description = "Refresh Token (HttpOnly Cookie)",
                    example = "refreshToken"
            )
            String refreshToken
    );
}
