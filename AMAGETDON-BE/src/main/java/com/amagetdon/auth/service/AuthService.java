package com.amagetdon.auth.service;

import com.amagetdon.auth.dto.request.AuthLoginRequest;
import com.amagetdon.auth.dto.request.AuthSignupRequest;
import com.amagetdon.auth.dto.response.TokenResponse;
import com.amagetdon.common.jwt.JwtProperties;
import com.amagetdon.common.jwt.JwtTokenProvider;
import com.amagetdon.user.service.UserService;
import com.amagetdon.user.dto.request.UserLoginRequest;
import com.amagetdon.user.dto.request.UserSignupRequest;
import com.amagetdon.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;

    public TokenResponse login(AuthLoginRequest request) {
        UserLoginRequest userLoginRequest = new UserLoginRequest(request.email(), request.password());
        User user = userService.validateLogin(userLoginRequest);

        return createTokenAndSave(user.getUserId(), false);
    }

    public TokenResponse signup(AuthSignupRequest request){
        UserSignupRequest userSignupRequest = new UserSignupRequest(
                request.email(),
                request.password(),
                request.nickname(),
                request.investmentType(),
                request.loginType()
        );
        User user = userService.signup(userSignupRequest);

        return createTokenAndSave(user.getUserId(), true);
    }

    public void logout(String refreshToken) {
        try {
            Long userId = jwtTokenProvider.getUserIdIgnoringExpiration(refreshToken);
            if (userId != null) {
                refreshTokenService.deleteRefreshTokenByUserId(userId);
            }
        } catch (Exception e) {
            // 토큰 파싱 자체가 불가능한 경우 무시
        }
    }

    public void withdraw(String refreshToken) {
        Long userId;
        try {
            String userIdStr = refreshTokenService.validateAndExtractUserId(refreshToken);
            userId = Long.parseLong(userIdStr);
        } catch (Exception e) {
            throw new SecurityException("인증 정보가 만료되었습니다. 다시 로그인 후 진행해주세요.");
        }

        userService.withdraw(userId);

        refreshTokenService.deleteRefreshTokenByUserId(userId);
    }

    public TokenResponse refresh(String refreshTokenFromCookie) {
        // 1. Refresh Token 검증 및 유저 ID 추출 (검증 실패 시 여기서 예외 발생)
        String userIdStr = refreshTokenService.validateAndExtractUserId(refreshTokenFromCookie);
        Long userId = Long.parseLong(userIdStr);

        // 2. 새로운 토큰 쌍(AT, RT) 생성 및 Redis 업데이트 (RTR 적용)
        refreshTokenService.deleteRefreshTokenByUserId(userId);
        return createTokenAndSave(userId, false);
    }

    public TokenResponse createTokenAndSave(Long userId, boolean firstLogin) {
        String accessToken = jwtTokenProvider.createAccessToken(userId);
        String refreshToken = jwtTokenProvider.createRefreshToken(userId);

        refreshTokenService.saveRefreshToken(userId, refreshToken);

        return new TokenResponse(accessToken, refreshToken, firstLogin);
    }
}
