package com.amagetdon.auth;

import com.amagetdon.auth.dto.request.AuthLoginRequest;
import com.amagetdon.auth.dto.response.AuthLoginResponse;
import com.amagetdon.auth.dto.response.TokenResponse;
import com.amagetdon.auth.service.AuthService;
import com.amagetdon.auth.service.RefreshTokenService;
import com.amagetdon.common.jwt.JwtProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final JwtProperties jwtProperties;


    @PostMapping("/login")
    public ResponseEntity<AuthLoginResponse> login(@RequestBody AuthLoginRequest request) {
        TokenResponse tokenResponse = authService.login(request);

        ResponseCookie refreshTokenCookie = refreshTokenService.createCookie(tokenResponse.refreshToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .body(AuthLoginResponse.builder()
                        .accessToken(tokenResponse.accessToken())
                        .tokenType("Bearer")
                        .expiration(jwtProperties.getAccessTokenExpirationMs() / 1000) //내부 시스템 Ms 단위를 프론트 S 단위로 변경
                        .firstLogin(tokenResponse.firstLogin())
                        .build());
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthLoginResponse> refresh(@CookieValue("refreshToken") String refreshToken) {
        TokenResponse token = authService.refresh(refreshToken);

        return ResponseEntity.ok(AuthLoginResponse.builder()
                .accessToken(token.accessToken())
                .tokenType("Bearer")
                .expiration(jwtProperties.getAccessTokenExpirationMs() / 1000)
                .firstLogin(false)
                .build());
    }
}
