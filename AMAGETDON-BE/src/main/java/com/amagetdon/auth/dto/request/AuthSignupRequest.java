package com.amagetdon.auth.dto.request;

import com.amagetdon.user.entity.InvestmentType;
import com.amagetdon.user.entity.LoginType;
import jakarta.validation.constraints.Email;

public record AuthSignupRequest(
        @Email
        String email,
        String password,
        String nickname,
        InvestmentType investmentType,
        LoginType loginType
) {}
