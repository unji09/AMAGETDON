package com.amagetdon.auth.dto.response;

import lombok.Builder;

@Builder
public record AuthLoginResponse(
        String accessToken,
        String tokenType,
        Long expiration,
        boolean firstLogin) {
}

