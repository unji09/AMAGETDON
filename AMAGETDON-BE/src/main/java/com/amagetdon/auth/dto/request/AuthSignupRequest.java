package com.amagetdon.auth.dto.request;

import jakarta.validation.constraints.Email;

public record AuthSignupRequest(
        @Email
        String email,
        String password,
        String nickname
) {}
