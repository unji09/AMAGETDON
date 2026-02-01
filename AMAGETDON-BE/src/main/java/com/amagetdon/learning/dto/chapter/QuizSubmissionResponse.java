package com.amagetdon.learning.dto.chapter;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class QuizSubmissionResponse {
    private boolean success;
    private String message;
    private QuizResultData data;

    @Getter
    @Builder
    public static class QuizResultData {
        private boolean isPassed;
        private int correctCount;
        private int totalCount;
        private int correctRate;
        private long rewardAmount;
        private int wrongQuizCount;
        private long currentBalance;
        private boolean nextChapterUnlocked;
    }
}
