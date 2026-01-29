package com.amagetdon.auth.dto.request;

import jakarta.validation.constraints.Email;

public record AuthLoginRequest(
        @Email
        String email,
        String password) {
}
