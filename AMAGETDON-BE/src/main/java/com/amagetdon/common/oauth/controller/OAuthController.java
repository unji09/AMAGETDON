package com.amagetdon.common.oauth.controller;

import com.amagetdon.auth.dto.response.AuthLoginResponse;
import com.amagetdon.auth.dto.response.TokenResponse;
import com.amagetdon.auth.service.RefreshTokenService;
import com.amagetdon.common.jwt.JwtProperties;
import com.amagetdon.common.oauth.dto.request.OAuthLoginRequest;
import com.amagetdon.common.oauth.service.OAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/oauth")
public class OAuthController {

    private final OAuthService oAuthService;
    private final RefreshTokenService refreshTokenService;
    private final JwtProperties jwtProperties;

    @PostMapping("/kakao/login")
    public ResponseEntity<?> kakaoOAuthlogin(@RequestBody OAuthLoginRequest request) {
        TokenResponse tokenResponse = oAuthService.login(request.provider(), request.accessToken());

        ResponseCookie refreshTokenCookie = refreshTokenService.createRefreshTokenCookie(tokenResponse.refreshToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .body(AuthLoginResponse.builder()
                        .accessToken(tokenResponse.accessToken())
                        .tokenType("Bearer")
                        .expiration(jwtProperties.getAccessTokenExpirationMs() / 1000)
                        .firstLogin(tokenResponse.firstLogin())
                        .build());
    }
}
