package com.amagetdon.learning.dto.quiz;

import jakarta.validation.constraints.*;
import org.springframework.lang.Nullable;

public record QuizSubmitRequest(
        @NotNull(message = "퀴즈 ID는 필수입니다") Long quizId,

        @NotBlank(message = "답안은 필수입니다") String answer, // OX: "O"/"X", MCQ: choiceId (String)

        @NotNull(message = "퀴즈 타입은 필수입니다") String quizSource // "NORMAL" or "CACHED"
) {
    public boolean isOxAnswer() {
        return "O".equals(answer) || "X".equals(answer);
    }

    @Nullable
    public Boolean getOxAnswerValue() {
        if (!isOxAnswer()) {
            return null;
        }
        return "O".equals(answer);
    }

    @Nullable
    public Long getChoiceId() {
        if (isOxAnswer()) {
            return null;
        }
        try {
            return Long.parseLong(answer);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}