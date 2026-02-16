package com.amagetdon.auth.dto.request;

import com.amagetdon.user.entity.InvestmentType;
import com.amagetdon.user.entity.LoginType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;

public record AuthSignupRequest(
        @Email
        String email,
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,20}$",
                message = "비밀번호는 8~20자이며, 영문, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다."
        )
        String password,
        String nickname,
        InvestmentType investmentType,
        LoginType loginType
) {}
