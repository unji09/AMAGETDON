package com.amagetdon.community.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomMemberDto {

    private Long memberId;
    private Long userId;
    private String nickname;
    private LocalDateTime joinedAt;
    private Boolean isOwner;
}
