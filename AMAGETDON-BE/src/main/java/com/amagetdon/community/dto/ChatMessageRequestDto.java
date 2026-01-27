package com.amagetdon.community.dto;

public record ChatMessageRequestDto(
        Long roomId,
        String sender,
        String message,
        String type
) {}
