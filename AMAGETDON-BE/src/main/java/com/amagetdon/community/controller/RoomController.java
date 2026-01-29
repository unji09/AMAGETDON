package com.amagetdon.community.controller;

import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.community.dto.RoomCreateRequestDto;
import com.amagetdon.community.dto.RoomResponseDto;
import com.amagetdon.community.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<RoomResponseDto> createGroup(@RequestBody RoomCreateRequestDto request) throws Exception{

        // JWT 토큰에 담긴 유저 ID를 가지고 오기.
        Long userId = SecurityUtil.getCurrentUserId();

        if(userId == null) {
            return ResponseEntity.status(401).build();
        }

        RoomResponseDto response = roomService.createGroup(userId, request);
        return ResponseEntity.ok(response);

    }
}
