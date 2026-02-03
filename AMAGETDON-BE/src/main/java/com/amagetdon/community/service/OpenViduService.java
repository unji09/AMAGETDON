package com.amagetdon.community.service;

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
    public String createSession(Map<String, Object> params) throws OpenViduJavaClientException, OpenViduHttpException {
        SessionProperties properties = SessionProperties.fromJson(params).build();
        Session session = openVidu.createSession(properties);
        return session.getSessionId();
    }

    /**
     * Connection 토큰 발급 (세션 자동 재생성)
     */
    public String createConnectionWithAutoRecreate(String sessionId, Map<String, Object> params)
            throws OpenViduJavaClientException, OpenViduHttpException {

        Session session = openVidu.getActiveSession(sessionId);

        // 메모리에 세션이 없으면 새로 생성
        if (session == null) {
            SessionProperties sessionProps = new SessionProperties.Builder().build();
            session = openVidu.createSession(sessionProps);
        }

        // Connection 생성
        try {
            ConnectionProperties properties = ConnectionProperties.fromJson(params).build();
            Connection connection = session.createConnection(properties);
            return connection.getToken();
        } catch (OpenViduHttpException e) {

            if (e.getMessage().contains("404")) {
                SessionProperties sessionProps = new SessionProperties.Builder().build();
                session = openVidu.createSession(sessionProps);

                ConnectionProperties properties = ConnectionProperties.fromJson(params).build();
                Connection connection = session.createConnection(properties);
                return connection.getToken();
            }
            throw e;
        }
    }

    /**
     * 세션 재생성
     */
    public String recreateSession(String oldSessionId, Map<String, Object> params)
            throws OpenViduJavaClientException, OpenViduHttpException {
        return createConnectionWithAutoRecreate(oldSessionId, params);
    }
}