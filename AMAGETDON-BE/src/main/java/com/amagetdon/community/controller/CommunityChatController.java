package com.amagetdon.community.controller;

import com.amagetdon.community.service.OpenViduService;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/sessions")
public class CommunityChatController {

    private final OpenViduService openViduService;

    @PostMapping
    public ResponseEntity<String> initializeSession(@RequestBody(required = false)Map<String, Object> params)
            throws OpenViduJavaClientException, OpenViduHttpException {
        return ResponseEntity.ok(openViduService.createSession(params));
    }

    @PostMapping("/{sessionId}/connections")
    public ResponseEntity<String> createConnection(@PathVariable String sessionId, @RequestBody(required = false)Map<String, Object> params)
            throws OpenViduJavaClientException, OpenViduHttpException {
        return ResponseEntity.ok(openViduService.createConnection(sessionId, params));
    }

}
