package com.amagetdon.learning.dto.quiz;

public record QuizSubmitResponse(
        Boolean isCorrect,
        String correctAnswer,  // OX: "O"/"X", MCQ: choiceId
        Integer rewardAmount,
        Boolean addedToReviewNote,
        Long currentBalance
) {
}