package com.amagetdon.learning.controller;

import com.amagetdon.learning.dto.quiz.QuizResponse;
import com.amagetdon.learning.dto.quiz.QuizSubmitRequest;
import com.amagetdon.learning.dto.quiz.QuizSubmitResponse;
import com.amagetdon.learning.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    /**
     * 오늘의 학습 퀴즈 1개 조회
     * GET /api/quizzes/daily
     */
    @GetMapping("/daily")
    public ResponseEntity<QuizResponse> getDailyQuiz(
            // TODO(민규): 인증 구현 후 변경
            @RequestHeader("User-Id") Long userId
    ) {
        QuizResponse response = quizService.getDailyQuiz(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 오늘의 학습 퀴즈 답안 제출
     * POST /api/quizzes/daily
     */
    @PostMapping("/daily")
    public ResponseEntity<QuizSubmitResponse> submitDailyQuiz(
            // TODO(민규): 인증 구현 후 변경
            @RequestHeader("User-Id") Long userId,
            @Valid @RequestBody QuizSubmitRequest request
    ) {
        QuizSubmitResponse response = quizService.submitQuiz(userId, request);
        return ResponseEntity.ok(response);
    }
}