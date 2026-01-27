package com.amagetdon.learning.dto.reviewnote;

import com.amagetdon.learning.entity.QuizType;
import org.springframework.lang.Nullable;

import java.time.LocalDateTime;
import java.util.List;

public record ReviewNoteDetail(
        Long reviewNoteId,
        Long quizId,
        QuizType quizType,
        String content,
        @Nullable List<ChoiceInfo> choices,  // OX면 null
        LocalDateTime addedAt
) {
    public record ChoiceInfo(
            Long choiceId,
            String choiceText,
            Integer choiceOrder
    ) {}
}z