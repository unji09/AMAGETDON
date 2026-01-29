package com.amagetdon.community.controller;

import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.community.dto.RoomCreateRequestDto;
import com.amagetdon.community.dto.RoomResponseDto;
import com.amagetdon.community.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    //생성
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

    //조회
    @GetMapping
    public ResponseEntity<Map<String, Object>> getPublicRooms(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<RoomResponseDto> roomsPage = roomService.getPublicRooms(page, size);

        Map<String, Object> response = new HashMap<>();
        Map<String, Object> data = new HashMap<>();

        data.put("rooms", roomsPage.getContent());
        data.put("totalElements", roomsPage.getTotalElements());
        data.put("totalPages", roomsPage.getTotalPages());
        data.put("currentPage", roomsPage.getNumber());

        response.put("data", data);

        return ResponseEntity.ok(response);
    }
}
