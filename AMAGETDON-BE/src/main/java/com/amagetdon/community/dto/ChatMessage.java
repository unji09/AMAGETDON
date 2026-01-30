package com.amagetdon.community.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long roomId;
    private Long userId;
    private String userName;
    private String message;
    private String type;
    private LocalDateTime createdAt;

}
