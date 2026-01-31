package com.amagetdon.common.oauth.dto.response;

public record KakaoUserResponse(
        Long providerId,
        KakaoProperties properties
) {

    public record KakaoProperties(
            String nickname
    ) {}
}
