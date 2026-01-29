package com.amagetdon.community.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RoomCreateRequestDto {
    private String name;
    private int maxMemberCount;
    private Boolean isPublic;
    private String joinCode;
}
