package com.amagetdon.user.dto.request;

import jakarta.validation.constraints.Email;

public record UserLoginRequest(
        @Email
        String email,
        String password
) {
}
