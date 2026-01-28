package com.amagetdon.community.controller;

import com.amagetdon.community.dto.ChatMessageRequestDto;
import io.openvidu.java.client.OpenVidu;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final OpenVidu openVidu;

    @Value("{openvidu.url}")
    private String openViduUrl;

    @Value("{openvidu.secret}")
    private String openViduSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/send")
    public ResponseEntity<Void> sendMessage(@RequestBody ChatMessageRequestDto request){

        if(openVidu.getActiveSession(String.valueOf(request.roomId())) == null){
            return ResponseEntity.notFound().build();
        }




    }


}
