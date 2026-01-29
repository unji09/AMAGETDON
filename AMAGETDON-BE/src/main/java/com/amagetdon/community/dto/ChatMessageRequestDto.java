package com.amagetdon.community.dto;

public record ChatMessageRequestDto(
        String openviduSessionId,
        String sender,
        String message,
        String type
) {}
