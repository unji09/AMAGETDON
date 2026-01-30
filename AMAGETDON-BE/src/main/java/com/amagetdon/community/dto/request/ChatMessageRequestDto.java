package com.amagetdon.community.dto.request;

public record ChatMessageRequestDto(
        String openviduSessionId,
        String sender,
        String message,
        String type
) {}
