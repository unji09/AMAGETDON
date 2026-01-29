package com.amagetdon.community.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MemberResponseDto {
    private Long memberId;
    private Long roomId;
    private Long userId;
    private Boolean isActive;
}
