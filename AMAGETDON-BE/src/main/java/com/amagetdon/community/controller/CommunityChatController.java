package com.amagetdon.community.controller;

import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.community.entity.Room;
import com.amagetdon.community.repository.RoomRepository;
import com.amagetdon.community.service.OpenViduService;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/sessions")
public class CommunityChatController {

    private final OpenViduService openViduService;
    private final RoomRepository roomRepository;

    @PostMapping
    public ResponseEntity<String> initializeSession(@RequestBody(required = false)Map<String, Object> params)
            throws OpenViduJavaClientException, OpenViduHttpException {
        return ResponseEntity.ok(openViduService.createSession(params));
    }

    @PostMapping("/{sessionId}/connections")
    public ResponseEntity<Map<String, String>> createConnection(
            @PathVariable String sessionId,
            @RequestBody(required = false)Map<String, Object> params)
            throws OpenViduJavaClientException, OpenViduHttpException {

        Long userId = SecurityUtil.getCurrentUserId();
        log.info("🎫 [CommunityChatController] Connection 요청 - sessionId: {}, userId: {}", sessionId, userId);

        // ✅ recreateSession() 사용 - 세션이 없으면 자동 재생성
        String token = openViduService.recreateSession(sessionId, params);

        // ✅ 새 세션 ID 가져오기 (토큰에서 추출)
        String actualSessionId = extractSessionIdFromToken(token);

        // ✅ DB의 Room 업데이트 (세션 ID가 변경된 경우)
        if (!sessionId.equals(actualSessionId)) {
            log.warn("⚠️ [CommunityChatController] 세션 ID 변경됨: {} → {}", sessionId, actualSessionId);
            roomRepository.findByOpenviduSessionId(sessionId).ifPresent(room -> {
                room.updateOpenViduSessionId(actualSessionId);
                roomRepository.save(room);
                log.info("✅ [CommunityChatController] Room 업데이트 완료 - roomId: {}, new sessionId: {}",
                        room.getId(), actualSessionId);
            });
        }

        // ✅ 토큰과 실제 세션 ID 모두 반환
        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        response.put("sessionId", actualSessionId);

        log.info("✅ [CommunityChatController] Connection 생성 완료 - sessionId: {}", actualSessionId);
        return ResponseEntity.ok(response);
    }

    /**
     * OpenVidu 토큰에서 Session ID 추출
     */
    private String extractSessionIdFromToken(String token) {
        try {
            // 토큰 형식: wss://localhost:4443?sessionId=ses_XXX&token=...
            String[] parts = token.split("sessionId=");
            if (parts.length > 1) {
                String sessionPart = parts[1].split("&")[0];
                return sessionPart;
            }
        } catch (Exception e) {
            log.error("❌ [CommunityChatController] 토큰에서 sessionId 추출 실패", e);
        }
        return null;
    }
}