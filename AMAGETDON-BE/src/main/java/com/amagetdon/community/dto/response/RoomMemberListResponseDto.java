package com.amagetdon.community.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomMemberListResponseDto {

    private Long roomId;
    private String roomName;
    private Integer totalMembers;
    private List<RoomMemberDto> members;
}
