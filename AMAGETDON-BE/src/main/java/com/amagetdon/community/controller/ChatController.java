package com.amagetdon.community.controller;

import com.amagetdon.common.ErrorCode;
import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.community.dto.ChatMessage;
import com.amagetdon.community.dto.request.ChatMessageRequestDto;
import com.amagetdon.community.entity.Room;
import com.amagetdon.community.repository.RoomRepository;
import com.amagetdon.community.service.ChatMessageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageService chatMessageService;
    private final RoomRepository roomRepository;
    private final ObjectMapper objectMapper;

    @Value("${openvidu.url}")
    private String openViduUrl;

    @Value("${openvidu.secret}")
    private String openViduSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 메시지 전송
     * 1. Redis에 저장 (메시지 영속화)
     * 2. OpenVidu signal 전송 (상대방에게 실시간 전달)
     */
    @PostMapping("/send")
    public ResponseEntity<Void> sendMessage(@RequestBody ChatMessageRequestDto request) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        Room room = roomRepository.findByOpenviduSessionId(request.openviduSessionId())
                .orElseThrow(() -> new IllegalArgumentException(ErrorCode.ROOM_NOT_FOUND.getMessage()));

        // 1. Redis 저장
        chatMessageService.saveMessage(
                room.getId(),
                userId,
                request.sender(),
                request.message(),
                request.type()
        );

        // 2. OpenVidu signal 전송 (에러 발생 시 무시 - 메시지는 이미 저장됨)
        try {
            String baseUrl = openViduUrl.endsWith("/") ? openViduUrl : openViduUrl + "/";
            String url = baseUrl + "openvidu/api/signal";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBasicAuth("OPENVIDUAPP", openViduSecret);

            Map<String, Object> signalData = new HashMap<>();
            signalData.put("userName", request.sender());
            signalData.put("userId", userId);
            signalData.put("message", request.message());
            signalData.put("type", request.type());

            Map<String, Object> body = new HashMap<>();
            body.put("session", request.openviduSessionId());
            body.put("data", objectMapper.writeValueAsString(signalData));
            body.put("type", request.type());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(url, entity, Void.class);

            log.info("메시지 전송 완료 - roomId: {}, userId: {}", room.getId(), userId);
        } catch (Exception e) {
            log.warn("OpenVidu signal 전송 실패 (메시지는 Redis에 저장됨) - {}", e.getMessage());
        }

        return ResponseEntity.ok().build();
    }

    @GetMapping("/messages/{roomId}")
    public ResponseEntity<Map<String, Object>> getMessages(@PathVariable Long roomId) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        List<ChatMessage> messages = chatMessageService.getMessages(roomId, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("data", messages);

        return ResponseEntity.ok(response);
    }

    // 읽지 않은 메시지 개수
    @GetMapping("/unread/{roomId}")
    public ResponseEntity<Map<String, Object>> getUnreadMessages(@PathVariable Long roomId) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        int count = chatMessageService.getUnreadCount(roomId, userId);
        Map<String, Object> response = new HashMap<>();
        response.put("unreadCount", count);
        return ResponseEntity.ok(response);
    }

    // 읽음 처리
    @PostMapping("/read/{roomId}")
    public ResponseEntity<Void> markAsRead(@PathVariable Long roomId) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        chatMessageService.markAsRead(roomId, userId);
        return ResponseEntity.ok().build();
    }
}