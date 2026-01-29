package com.amagetdon.auth.service;

import com.amagetdon.auth.dto.request.AuthLoginRequest;
import com.amagetdon.auth.dto.request.AuthSignupRequest;
import com.amagetdon.auth.dto.response.TokenResponse;
import com.amagetdon.common.jwt.JwtProperties;
import com.amagetdon.common.jwt.JwtTokenProvider;
import com.amagetdon.user.UserService;
import com.amagetdon.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final JwtProperties jwtProperties;

    public TokenResponse login(AuthLoginRequest request) {
        User user = userService.validateLogin(request.email(), request.password());

        return createTokenAndSave(user.getUserId(), false);
    }

    public TokenResponse singup(AuthSignupRequest request){
        User user = userService.signup(request.email(), request.password(), request.nickname());

        return createTokenAndSave(user.getUserId(), true);
    }


    public TokenResponse refresh(String refreshToken) {

        if (!refreshTokenService.exists(refreshToken)) {
            throw new SecurityException("유효하지 않은 refresh token입니다.");
        }

        Long userId = refreshTokenService.getUserId(refreshToken);

        String newAccessToken = jwtTokenProvider.createAccessToken(userId);

        return new TokenResponse(newAccessToken, null, false);
    }

    public TokenResponse createTokenAndSave(Long userId, boolean firstLogin) {
        String accessToken = jwtTokenProvider.createAccessToken(userId);
        String refreshToken = jwtTokenProvider.createRefreshToken(userId);

        refreshTokenService.save(refreshToken, userId);

        return new TokenResponse(accessToken, refreshToken, firstLogin);
    }
}
