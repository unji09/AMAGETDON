package com.amagetdon.auth.dto.response;


public record TokenResponse(
        String accessToken,
        String refreshToken,
        boolean firstLogin
) {
}
