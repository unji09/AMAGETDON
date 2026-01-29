package com.amagetdon.community.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class RoomResponseDto {
    private Long roomId;
    private String name;
    private String openviduSessionId;
}
