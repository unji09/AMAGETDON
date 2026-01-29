package com.amagetdon.community.controller;

import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.community.dto.request.JoinPrivateRoomRequest;
import com.amagetdon.community.dto.response.MemberResponseDto;
import com.amagetdon.community.dto.request.RoomCreateRequestDto;
import com.amagetdon.community.dto.response.RoomLeaveResponseDto;
import com.amagetdon.community.dto.response.RoomResponseDto;
import com.amagetdon.community.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/community/rooms")
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

    // 공개방 참여
    @PostMapping("/{roomId}/join")
    public ResponseEntity<Map<String, Object>> joinPublicRoom(@PathVariable Long roomId) {

        Long userId = SecurityUtil.getCurrentUserId();

        if(userId == null) {
            return ResponseEntity.status(401).build();
        }

        MemberResponseDto memberResponse = roomService.joinPublicRoom(userId, roomId);

        Map<String, Object> response = new HashMap<>();
        response.put("data", memberResponse);

        return ResponseEntity.ok(response);
    }

    // 비밀방 참여
    @PostMapping("/joinPrivate")
    public ResponseEntity<Map<String, Object>> joinPrivateRoom(@RequestBody JoinPrivateRoomRequest request) {

        Long userId = SecurityUtil.getCurrentUserId();

        if(userId == null) {
            return ResponseEntity.status(401).build();
        }

        MemberResponseDto memberResponse = roomService.joinPrivateRoom(userId, request.getJoinCode());
        Map<String, Object> response = new HashMap<>();
        response.put("data", memberResponse);

        return ResponseEntity.ok(response);
    }

    // 방 나가기
    @DeleteMapping("/{roomId}/leave")
    public ResponseEntity<RoomLeaveResponseDto> leaveRoom(@PathVariable Long roomId) {

        Long userId = SecurityUtil.getCurrentUserId();

        if(userId == null) {
            return ResponseEntity.status(401).build();
        }

        RoomLeaveResponseDto response = roomService.leaveRoom(userId, roomId);
        return ResponseEntity.ok(response);
    }
}
