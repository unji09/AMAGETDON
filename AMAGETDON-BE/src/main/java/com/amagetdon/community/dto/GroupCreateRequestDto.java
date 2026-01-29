package com.amagetdon.community.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class GroupCreateRequestDto {
    private String name;
    private String maxMemberCount;
    private String isPublic;
    private String joinCode;
}
