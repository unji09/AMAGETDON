package com.amagetdon.common.oauth.service;

import com.amagetdon.auth.dto.response.TokenResponse;
import com.amagetdon.auth.service.RefreshTokenService;
import com.amagetdon.common.jwt.JwtTokenProvider;
import com.amagetdon.common.oauth.KakaoOAuthClient;
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
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;

    public TokenResponse login(LoginType provider, String accessToken) {

        KakaoUserResponse userInfo = switch((provider)) {
            case KAKAO -> kakaoOAuthClient.getUserInfo(accessToken);
            default -> throw new IllegalArgumentException("지원 불가한 provider입니다.");
        };

        User user = userService.findOAuthUser(userInfo, provider);

        boolean isFirstLogin = false;
        if(user == null) {
            user = userService.oAuthSignup(userInfo, provider);
            isFirstLogin = true;
        }

        return createTokenAndSave(user.getUserId(), isFirstLogin);
    }

    public TokenResponse createTokenAndSave(Long userId, boolean firstLogin) {
        String accessToken = jwtTokenProvider.createAccessToken(userId);
        String refreshToken = jwtTokenProvider.createRefreshToken(userId);

        refreshTokenService.saveRefreshToken(refreshToken, userId);

        return new TokenResponse(accessToken, refreshToken, firstLogin);
    }
}
