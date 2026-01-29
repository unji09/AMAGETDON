package com.amagetdon.user.dto.request;

import com.amagetdon.user.entity.InvestmentType;
import com.amagetdon.user.entity.LoginType;
import jakarta.validation.constraints.Email;

public record UserSignupRequest(
        @Email
        String email,
        String password,
        String nickname,
        InvestmentType investmentType,
        LoginType loginType
) {
}
