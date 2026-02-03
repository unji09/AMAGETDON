package com.amagetdon.community.service;

import com.amagetdon.common.ErrorCode;
import io.openvidu.java.client.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class OpenViduService {

    private final OpenVidu openVidu;

    /**
     * 새 OpenVidu 세션 생성
     */
    public String createSession(Map<String,Object> params) throws OpenViduJavaClientException, OpenViduHttpException {
        SessionProperties properties = SessionProperties.fromJson(params).build();
        Session session = openVidu.createSession(properties);
        log.info("✅ [OpenViduService] 새 세션 생성 완료 - sessionId: {}", session.getSessionId());
        return session.getSessionId();
    }

    /**
     * ✅ Connection 토큰 발급 (세션 자동 재생성)
     * - 메모리에 세션이 없으면 자동으로 새로 생성
     * - 기존 세션이 있어도 OpenVidu 서버에 없으면 새로 생성
     */
    public String createConnectionWithAutoRecreate(String sessionId, Map<String,Object> params)
            throws OpenViduJavaClientException, OpenViduHttpException {

        Session session = openVidu.getActiveSession(sessionId);

        // 메모리에 세션이 없으면 새로 생성
        if (session == null) {
            log.warn("⚠️ [OpenViduService] 메모리에 세션 없음 - 새 세션 생성");
            SessionProperties sessionProps = new SessionProperties.Builder().build();
            session = openVidu.createSession(sessionProps);
            log.info("✅ [OpenViduService] 새 세션 생성 완료 - sessionId: {}", session.getSessionId());
        } else {
            log.info("✅ [OpenViduService] 메모리에 세션 존재 - sessionId: {}", sessionId);
        }

        // Connection 생성 (OpenVidu 서버와 통신)
        try {
            ConnectionProperties properties = ConnectionProperties.fromJson(params).build();
            Connection connection = session.createConnection(properties);
            log.info("✅ [OpenViduService] Connection 토큰 발급 완료");
            return connection.getToken();
        } catch (OpenViduHttpException e) {
            // 404 에러: OpenVidu 서버에 세션이 없음
            if (e.getMessage().contains("404")) {
                log.error("❌ [OpenViduService] OpenVidu 서버에 세션 없음 - 새 세션으로 재시도");

                // 기존 세션 버리고 새로 생성
                SessionProperties sessionProps = new SessionProperties.Builder().build();
                session = openVidu.createSession(sessionProps);
                log.info("✅ [OpenViduService] 새 세션 생성 완료 - sessionId: {}", session.getSessionId());

                // 다시 Connection 생성
                ConnectionProperties properties = ConnectionProperties.fromJson(params).build();
                Connection connection = session.createConnection(properties);
                log.info("✅ [OpenViduService] Connection 토큰 발급 완료 (재시도 성공)");
                return connection.getToken();
            }
            throw e;
        }
    }

    /**
     * ❌ DEPRECATED: 세션이 없으면 예외 발생 (기존 동작 유지)
     * - 새 코드에서는 createConnectionWithAutoRecreate() 사용 권장
     */
    @Deprecated
    public String createConnection(String sessionId, Map<String,Object> params)
            throws OpenViduJavaClientException, OpenViduHttpException {
        Session session = openVidu.getActiveSession(sessionId);
        if (session == null) {
            log.error("❌ [OpenViduService] 세션을 찾을 수 없습니다 - sessionId: {}", sessionId);
            throw new IllegalArgumentException(ErrorCode.SESSION_NOT_FOUND.getMessage());
        }

        ConnectionProperties properties = ConnectionProperties.fromJson(params).build();
        Connection connection = session.createConnection(properties);
        return connection.getToken();
    }

    /**
     * 세션 재생성 (기존 메서드 - recreateSession에서 이름 변경)
     */
    public String recreateSession(String oldSessionId, Map<String,Object> params)
            throws OpenViduJavaClientException, OpenViduHttpException {
        return createConnectionWithAutoRecreate(oldSessionId, params);
    }
}