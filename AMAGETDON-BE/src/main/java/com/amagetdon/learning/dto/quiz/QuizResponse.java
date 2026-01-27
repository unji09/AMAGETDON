package com.amagetdon.learning.dto.quiz;

import com.amagetdon.learning.entity.QuizType;
import org.springframework.lang.Nullable;

import java.util.List;

public record QuizResponse(
        Integer quizSequence,
        Boolean isQuizRewardReceived,
        QuizDetail quiz
) {
    public record QuizDetail(
            Long quizId,
            QuizType quizType,
            String content,
            @Nullable List<ChoiceInfo> choices  // OX면 null
    ) {}

    public record ChoiceInfo(
            Long choiceId,
            String choiceText,
            Integer choiceOrder
    ) {}
}