package com.amagetdon.community.dto;

public record ChatMessageRequestDto(
        String roomId,
        String sender,
        String message,
        String type
) {}
