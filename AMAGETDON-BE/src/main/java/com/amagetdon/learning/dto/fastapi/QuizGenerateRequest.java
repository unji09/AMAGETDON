package com.amagetdon.learning.dto.fastapi;

public record QuizGenerateRequest(
        Integer count,
        String difficulty,
        String quizType
) {
}