package com.amagetdon.community.controller;

import com.amagetdon.common.security.SecurityUtil;
import io.openvidu.java.client.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sessions")
@RequiredArgsConstructor
public class OpenViduController {

    private final OpenVidu openVidu;

    /**
     * OpenVidu 커넥션 토큰 발급
     * 프론트엔드가 세션에 연결하기 위한 토큰 생성
     */
    @PostMapping("/{sessionId}/connections")
    public ResponseEntity<String> createConnection(@PathVariable String sessionId) {

        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            // 세션 가져오기 (없으면 null 반환)
            Session session = openVidu.getActiveSession(sessionId);

            // 세션이 없으면 404 반환
            if (session == null) {
                System.err.println("❌ 세션을 찾을 수 없습니다: " + sessionId);
                return ResponseEntity.status(404).body("세션을 찾을 수 없습니다");
            }

            // 커넥션 프로퍼티 설정
            ConnectionProperties properties = new ConnectionProperties.Builder()
                    .type(ConnectionType.WEBRTC)
                    .data("userId=" + userId) // 사용자 정보 포함
                    .build();

            // 토큰 생성
            Connection connection = session.createConnection(properties);
            String token = connection.getToken();

            System.out.println("✅ 토큰 발급 성공 - sessionId: " + sessionId + ", userId: " + userId);

            // 토큰을 Plain Text로 반환
            return ResponseEntity.ok(token);

        } catch (OpenViduJavaClientException | OpenViduHttpException e) {
            System.err.println("❌ 토큰 발급 실패: " + e.getMessage());
            return ResponseEntity.status(500).body("토큰 발급에 실패했습니다");
        }
    }
}