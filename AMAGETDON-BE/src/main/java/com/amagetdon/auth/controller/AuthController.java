package com.amagetdon.auth.controller;

import com.amagetdon.auth.dto.request.AuthLoginRequest;
import com.amagetdon.auth.dto.request.AuthSignupRequest;
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

        ResponseCookie refreshTokenCookie = refreshTokenService.createRefreshTokenCookie(tokenResponse.refreshToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .body(AuthLoginResponse.builder()
                        .accessToken(tokenResponse.accessToken())
                        .tokenType("Bearer")
                        .expiration(jwtProperties.getAccessTokenExpirationMs() / 1000) //내부 시스템 Ms 단위를 프론트 S 단위로 변경
                        .firstLogin(tokenResponse.firstLogin())
                        .build());
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthLoginResponse> signup(@RequestBody AuthSignupRequest request) {
        TokenResponse tokenResponse = authService.signup(request);

        ResponseCookie refreshTokenCookie = refreshTokenService.createRefreshTokenCookie(tokenResponse.refreshToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .body(AuthLoginResponse.builder()
                        .accessToken(tokenResponse.accessToken())
                        .tokenType("Bearer")
                        .expiration(jwtProperties.getAccessTokenExpirationMs() / 1000) //내부 시스템 Ms 단위를 프론트 S 단위로 변경
                        .firstLogin(tokenResponse.firstLogin())
                        .build());
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@CookieValue(value = "refreshToken", required = false) String refreshToken) {
        refreshTokenService.deleteRefreshToken(refreshToken);

        ResponseCookie deleteCookie = refreshTokenService.deleteRefreshTokenCookie();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .body("로그아웃 되었습니다.");
    }

    @DeleteMapping("/withdraw")
    public ResponseEntity<?> withdraw(@CookieValue("refreshToken") String refreshToken) {
        authService.withdraw(refreshToken);

        ResponseCookie deleteCookie = refreshTokenService.deleteRefreshTokenCookie();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .body("회원 탈퇴가 완료되었습니다.");
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthLoginResponse> refresh(@CookieValue("refreshToken") String refreshToken) {
        TokenResponse tokenResponse = authService.refresh(refreshToken);

        ResponseCookie newRefreshTokenCookie = refreshTokenService.createRefreshTokenCookie(tokenResponse.refreshToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, newRefreshTokenCookie.toString())
                .body(AuthLoginResponse.builder()
                .accessToken(tokenResponse.accessToken())
                .tokenType("Bearer")
                .expiration(jwtProperties.getAccessTokenExpirationMs() / 1000)
                .firstLogin(false)
                .build());
    }
}
