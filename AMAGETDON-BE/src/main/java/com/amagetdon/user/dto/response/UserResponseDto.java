package com.amagetdon.user.dto.response;

import lombok.*;

@Builder
public record UserResponseDto(
        String userId,
        String email,
        String nickname,
        String investmentType,
        String loginType,
        Long socialId,
        String currentTitle,
        Integer totalPoints,
        Long balance
) {
}
