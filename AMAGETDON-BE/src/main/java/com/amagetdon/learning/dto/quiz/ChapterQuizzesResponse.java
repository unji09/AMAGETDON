package com.amagetdon.learning.dto.quiz;

import com.amagetdon.learning.entity.ChapterType;
import com.amagetdon.learning.entity.QuizType;

import java.util.List;

public record ChapterQuizzesResponse(
        Long chapterId,
        String chapterTitle,
        ChapterType chapterType,
        Integer passThreshold,
        Integer rewardAmount,
        List<QuizItem> quizzes
) {
    public record QuizItem(
            Long quizId,
            QuizType quizType,
            String content,
            List<ChoiceInfo> choices
    ) {
    }

    public record ChoiceInfo(
            Long choiceId,
            String choiceText,
            Integer choiceOrder
    ) {
    }
}
