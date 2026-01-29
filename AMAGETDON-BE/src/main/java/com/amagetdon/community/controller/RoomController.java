package com.amagetdon.community.controller;

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

        Long currentUserId = 1L;

        RoomResponseDto response = roomService.createGroup(currentUserId, request);
        return ResponseEntity.ok(response);

    }
}
