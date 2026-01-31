package com.amagetdon.common.oauth.dto.request;

import com.amagetdon.user.entity.LoginType;

public record OAuthLoginRequest(
        LoginType provider,
        String accessToken
) {}
