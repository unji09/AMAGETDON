package com.amagetdon.learning.dto.chapter;

import java.util.List;

public record QuizSubmissionRequest(
        List<AnswerItem> answers
) {
    public record AnswerItem(
            Long quizId,
            String answer
    ) {
    }
}
