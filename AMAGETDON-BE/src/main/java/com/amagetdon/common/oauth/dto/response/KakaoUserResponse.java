package com.amagetdon.common.oauth.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record KakaoUserResponse(
        @JsonProperty("id") Long providerId,
        KakaoProperties properties
) {

    public record KakaoProperties(
            String nickname
    ) {}
}
