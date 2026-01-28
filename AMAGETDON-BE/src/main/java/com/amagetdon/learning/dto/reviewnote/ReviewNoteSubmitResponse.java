package com.amagetdon.learning.dto.reviewnote;

public record ReviewNoteSubmitResponse(
        Boolean isCorrect,
        String correctAnswer,  // OX: "O"/"X", MCQ: choiceId
        Boolean deletedFromReviewNote,  // 정답 맞춰서 오답노트에서 삭제됐는지
        Integer rewardAmount,  // 오늘 첫 풀이 50,000원, 이미 받음 0원
        Long currentBalance,
        Integer remainingReviewNoteCount  // 남은 오답노트 문제 개수3
) {
}