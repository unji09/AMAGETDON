package com.amagetdon.community.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder

public class RoomResponseDto {
    private Long roomId;
    private String name;
    private String openviduSessionId;
    private Integer currentMemberCount;
    private Integer maxMemberCount;
    private Boolean isPublic;
    private String joinCode;
    private LocalDateTime createdAt;
}
