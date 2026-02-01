package com.amagetdon.common.oauth.dto.request;

public record OAuthLoginRequest(
        String provider,
        String code
) {}
