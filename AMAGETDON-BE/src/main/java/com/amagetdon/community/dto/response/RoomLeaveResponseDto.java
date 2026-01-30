package com.amagetdon.community.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RoomLeaveResponseDto {
    private Long roomId;
    private Boolean isRoomDeleted;
    private LocalDateTime leftAt;
}
