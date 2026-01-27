package com.amagetdon.learning.dto.quiz;

import jakarta.validation.constraints.*;
import org.springframework.lang.Nullable;

public record QuizSubmitRequest(
        @NotNull(message = "퀴즈 ID는 필수입니다")
        Long quizId,

        @NotBlank(message = "답안은 필수입니다")
        String answer,  // OX: "O"/"X", MCQ: choiceId (String)

        @NotNull(message = "퀴즈 순서는 필수입니다")
        @Min(value = 1, message = "퀴즈 순서는 1 이상이어야 합니다")
        @Max(value = 100, message = "퀴즈 순서는 100 이하여야 합니다")
        Integer quizSequence
) {
    // answer 파싱 헬퍼
    public boolean isOxAnswer() {
        return "O".equals(answer) || "X".equals(answer);
    }

    @Nullable
    public Boolean getOxAnswerValue() {
        if (!isOxAnswer()) {
            return null;
        }
        return "O".equals(answer);  // O=true, X=false
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