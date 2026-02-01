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
    public ResponseEntity<Map<String, Object>> createGroup(@RequestBody RoomCreateRequestDto request) throws Exception{

        // JWT 토큰에 담긴 유저 ID를 가지고 오기.
        Long userId = SecurityUtil.getCurrentUserId();

        if(userId == null) {
            return ResponseEntity.status(401).build();
        }

        RoomResponseDto response = roomService.createGroup(userId, request);

        Map<String,Object> result = new HashMap<>();
        result.put("data", response);
        return ResponseEntity.ok(result);

    }

    //조회
    @GetMapping
    public ResponseEntity<Map<String, Object>> getPublicRooms(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Long userId = SecurityUtil.getCurrentUserId();
        if(userId == null) {
            return ResponseEntity.status(401).build();
        }

        Page<RoomResponseDto> roomsPage = roomService.getPublicRooms(search, page, size);

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
    public ResponseEntity<Map<String, Object>> leaveRoom(@PathVariable Long roomId) {

        Long userId = SecurityUtil.getCurrentUserId();

        if(userId == null) {
            return ResponseEntity.status(401).build();
        }

        RoomLeaveResponseDto leaveResponse = roomService.leaveRoom(userId, roomId);
        Map<String, Object> response = new HashMap<>();
        response.put("data", leaveResponse);

        return ResponseEntity.ok(response);
    }

    // 내가 속한 그룹 조회
    @GetMapping("/myRooms")
    public ResponseEntity<Map<String, Object>> getMyRooms() {

        Long userId = SecurityUtil.getCurrentUserId();

        if(userId == null) {
            return ResponseEntity.status(401).build();
        }

        RoomResponseDto myRoom = roomService.getMyRoom(userId);

        Map<String, Object> response = new HashMap<>();
        Map<String, Object> data = new HashMap<>();
        data.put("room", myRoom);
        response.put("data", data);

        return ResponseEntity.ok(response);
    }
}
