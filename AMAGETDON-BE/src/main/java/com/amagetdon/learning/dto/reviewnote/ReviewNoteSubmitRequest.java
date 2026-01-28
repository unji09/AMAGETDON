package com.amagetdon.learning.dto.reviewnote;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.lang.Nullable;

public record ReviewNoteSubmitRequest(
        @NotNull(message = "퀴즈 ID는 필수입니다")
        Long quizId,

        @NotBlank(message = "답안은 필수입니다")
        String answer  // OX: "O"/"X", MCQ: choiceId (String)
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