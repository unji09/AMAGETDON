package com.amagetdon.common.oauth.service;

import com.amagetdon.auth.dto.response.TokenResponse;
import com.amagetdon.auth.service.RefreshTokenService;
import com.amagetdon.common.jwt.JwtTokenProvider;
import com.amagetdon.common.oauth.KakaoOAuthClient;
import com.amagetdon.common.oauth.KakaoTokenClient;
import com.amagetdon.common.oauth.dto.response.KakaoUserResponse;
import com.amagetdon.user.entity.LoginType;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OAuthService {

    private final KakaoOAuthClient kakaoOAuthClient;
    private final KakaoTokenClient kakaoTokenClient;
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;

    public TokenResponse loginWithCode(String code) {

        String kakaoAccessToken = kakaoTokenClient.getAccessToken(code);

        KakaoUserResponse userInfo = kakaoOAuthClient.getUserInfo(kakaoAccessToken);

        User user = userService.findOAuthUser(userInfo, LoginType.KAKAO);

        boolean firstLogin = false;
        if (user == null) {
            user = userService.oAuthSignup(userInfo, LoginType.KAKAO);
            firstLogin = true;
        }

        return createTokenAndSave(user.getUserId(), firstLogin);
    }

    public TokenResponse createTokenAndSave(Long userId, boolean firstLogin) {
        String accessToken = jwtTokenProvider.createAccessToken(userId);
        String refreshToken = jwtTokenProvider.createRefreshToken(userId);

        refreshTokenService.saveRefreshToken(userId, refreshToken);

        return new TokenResponse(accessToken, refreshToken, firstLogin);
    }
}
