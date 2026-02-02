package com.amagetdon.learning.controller;

import com.amagetdon.learning.dto.quiz.QuizResponse;
import com.amagetdon.learning.dto.quiz.QuizSubmitRequest;
import com.amagetdon.learning.dto.quiz.QuizSubmitResponse;
import com.amagetdon.learning.service.QuizService;
import com.amagetdon.common.security.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "퀴즈", description = "오늘의 학습 퀴즈 조회 및 제출 API")
@RestController
@RequestMapping("/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    @Operation(
            summary = "오늘의 퀴즈 조회",
            description = "오늘 풀 수 있는 랜덤 퀴즈 1개를 조회합니다. 이미 푼 문제는 제외됩니다. JWT 토큰에서 사용자 정보를 자동으로 추출합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "퀴즈 조회 성공",
                    content = @Content(schema = @Schema(implementation = QuizResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "더 이상 풀 수 있는 퀴즈가 없습니다"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증되지 않은 사용자입니다"
            )
    })
    @GetMapping("/daily")
    public ResponseEntity<QuizResponse> getDailyQuiz() {
        Long userId = SecurityUtil.getCurrentUserId();
        QuizResponse response = quizService.getDailyQuiz(userId);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "퀴즈 답안 제출",
            description = """
            오늘의 퀴즈 답안을 제출합니다. JWT 토큰에서 사용자 정보를 자동으로 추출합니다.
            
            - 정답: 보상 지급 (1번: 100,000원, 2-100번: 1,000원)
            - 오답: 오답노트에 자동 저장
            - OX 문제: answer에 "O" 또는 "X"
            - 객관식 문제: answer에 선택지 ID (문자열)
            """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "답안 제출 성공",
                    content = @Content(schema = @Schema(implementation = QuizSubmitResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "이미 푼 문제이거나 오늘의 퀴즈를 모두 완료했습니다"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증되지 않은 사용자입니다"
            )
    })
    @PostMapping("/daily")
    public ResponseEntity<QuizSubmitResponse> submitDailyQuiz(
            @RequestBody(
                    description = "퀴즈 답안 제출 정보",
                    required = true,
                    content = @Content(
                            schema = @Schema(implementation = QuizSubmitRequest.class),
                            examples = {
                                    @ExampleObject(
                                            name = "OX 퀴즈 예시",
                                            summary = "OX 문제 답안",
                                            description = "answer에 'O' 또는 'X' 입력",
                                            value = """
                            {
                              "quizId": 1,
                              "answer": "O"
                            }
                            """
                                    ),
                                    @ExampleObject(
                                            name = "객관식 퀴즈 예시",
                                            summary = "객관식 문제 답안",
                                            description = "answer에 선택지 ID를 문자열로 입력",
                                            value = """
                            {
                              "quizId": 380,
                              "answer": "770"
                            }
                            """
                                    )
                            }
                    )
            )
            @Valid @org.springframework.web.bind.annotation.RequestBody QuizSubmitRequest request
    ) {
        Long userId = SecurityUtil.getCurrentUserId();
        QuizSubmitResponse response = quizService.submitQuiz(userId, request);
        return ResponseEntity.ok(response);
    }
}