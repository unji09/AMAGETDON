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
    private final JwtProperties jwtProperties;

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


    public TokenResponse refresh(String refreshToken) {
        if (!refreshTokenService.exists(refreshToken)) {
            throw new SecurityException("유효하지 않은 refresh token입니다.");
        }

        Long userId = refreshTokenService.getUserId(refreshToken);

        refreshTokenService.delete(refreshToken);

        return createTokenAndSave(userId, false);
    }

    public TokenResponse createTokenAndSave(Long userId, boolean firstLogin) {
        String accessToken = jwtTokenProvider.createAccessToken(userId);
        String refreshToken = jwtTokenProvider.createRefreshToken(userId);

        refreshTokenService.save(refreshToken, userId);

        return new TokenResponse(accessToken, refreshToken, firstLogin);
    }
}
