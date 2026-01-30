package com.amagetdon.community.controller;

import com.amagetdon.common.ErrorCode;
import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.community.dto.ChatMessage;
import com.amagetdon.community.dto.request.ChatMessageRequestDto;
import com.amagetdon.community.entity.Room;
import com.amagetdon.community.repository.RoomRepository;
import com.amagetdon.community.service.ChatMessageService;
import io.openvidu.java.client.OpenVidu;
import lombok.RequiredArgsConstructor;
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

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final OpenVidu openVidu;
    private final ChatMessageService chatMessageService;
    private final RoomRepository roomRepository;

    @Value("${openvidu.url}")
    private String openViduUrl;

    @Value("${openvidu.secret}")
    private String openViduSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/send")
    public ResponseEntity<Void> sendMessage(@RequestBody ChatMessageRequestDto request){

        Long userId = SecurityUtil.getCurrentUserId();
        if(userId == null){
            return ResponseEntity.status(401).build();
        }

        // 세션 확인
        if(openVidu.getActiveSession(request.openviduSessionId()) == null){
            return ResponseEntity.notFound().build();
        }

        // 방 찾기
        Room room = roomRepository.findByOpenviduSessionId(request.openviduSessionId())
                .orElseThrow(() -> new IllegalArgumentException(ErrorCode.ROOM_NOT_FOUND.getMessage()));

        chatMessageService.saveMessage(
                room.getId(),
                userId,
                request.sender(),
                request.message(),
                request.type()
        );

        // 오픈비두 서버 REST API 엔드포인트 설정
        String baseUrl = openViduUrl.endsWith("/") ? openViduUrl : openViduUrl + "/";
        String url = baseUrl + "openvidu/api/signal";

        // HTTP Header 설정 (Basic Auth 인증 필요함)
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBasicAuth("OPENVIDUAPP", openViduSecret); // OPENVIDU 표준 인증 방식

        // 전송할 데이터 구성
        Map<String, Object> body = new HashMap<>();
        body.put("session", request.openviduSessionId());
        body.put("data", request.message());
        body.put("type", request.type());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        restTemplate.postForEntity(url, entity, Void.class);

        return ResponseEntity.ok().build();
    }

    // 채팅 조회
    @GetMapping("/messages/{roomId}")
    public ResponseEntity<Map<String, Object>> getMessages(@PathVariable Long roomId) {

        Long userId = SecurityUtil.getCurrentUserId();
        if(userId == null) {
            return ResponseEntity.status(401).build();
        }

        List<ChatMessage> messages = chatMessageService.getMessages(roomId, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("data", messages);

        return ResponseEntity.ok(response);
    }
}
