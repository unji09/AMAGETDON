package com.amagetdon.learning.controller;

import com.amagetdon.learning.dto.reviewnote.ReviewNoteListResponse;
import com.amagetdon.learning.dto.reviewnote.ReviewNoteSubmitRequest;
import com.amagetdon.learning.dto.reviewnote.ReviewNoteSubmitResponse;
import com.amagetdon.learning.service.ReviewNoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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

@Tag(name = "오답노트", description = "틀린 문제 관리 및 복습 API")
@RestController
@RequestMapping("/quizzes")
@RequiredArgsConstructor
public class ReviewNoteController {

    private final ReviewNoteService reviewNoteService;

    @Operation(
            summary = "오답노트 목록 조회",
            description = """
                    사용자의 오답노트 목록을 챕터별로 그룹화하여 조회합니다.
                                
                    - 챕터별로 그룹화된 오답 문제 리스트
                    - 객관식 문제는 선택지 포함
                    - 총 오답 개수 제공
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = ReviewNoteListResponse.class))
            )
    })
    @GetMapping("/reviewNotes")
    public ResponseEntity<ReviewNoteListResponse> getReviewNotes(
            @Parameter(
                    description = "사용자 ID (임시 인증용)",
                    required = true,
                    example = "1"
            )
            @RequestHeader("User-Id") Long userId
    ) {
        ReviewNoteListResponse response = reviewNoteService.getReviewNotes(userId);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "오답노트 풀이 제출",
            description = """
                    오답노트에 저장된 문제의 답안을 제출합니다.
                                
                    - 정답: 오답노트에서 자동 삭제
                    - 오답: 오답노트에 계속 유지
                    - 오늘 첫 풀이: 50,000원 보상 지급 (하루 1회)
                    - OX 문제: answer에 "O" 또는 "X"
                    - 객관식 문제: answer에 선택지 ID (문자열)
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "답안 제출 성공",
                    content = @Content(schema = @Schema(implementation = ReviewNoteSubmitResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "오답노트에 없는 문제이거나 잘못된 요청입니다"
            )
    })
    @PostMapping("/reviewNotes")
    public ResponseEntity<ReviewNoteSubmitResponse> submitReviewNote(
            @Parameter(
                    description = "사용자 ID (임시 인증용)",
                    required = true,
                    example = "1"
            )
            @RequestHeader("User-Id") Long userId,

            @RequestBody(
                    description = "오답노트 답안 제출 정보",
                    required = true,
                    content = @Content(
                            schema = @Schema(implementation = ReviewNoteSubmitRequest.class),
                            examples = {
                                    @ExampleObject(
                                            name = "OX 퀴즈 예시",
                                            summary = "OX 문제 답안",
                                            description = "answer에 'O' 또는 'X' 입력",
                                            value = """
                                                    {
                                                      "quizId": 202,
                                                      "answer": "X"
                                                    }
                                                    """
                                    ),
                                    @ExampleObject(
                                            name = "객관식 퀴즈 예시",
                                            summary = "객관식 문제 답안",
                                            description = "answer에 선택지 ID를 문자열로 입력",
                                            value = """
                                                    {
                                                      "quizId": 208,
                                                      "answer": "813"
                                                    }
                                                    """
                                    )
                            }
                    )
            )
            @Valid @org.springframework.web.bind.annotation.RequestBody ReviewNoteSubmitRequest request
    ) {
        ReviewNoteSubmitResponse response = reviewNoteService.submitReviewNote(userId, request);
        return ResponseEntity.ok(response);
    }


    @Operation(
            summary = "오답노트 삭제",
            description = """
                    특정 오답노트를 삭제합니다.
                                
                    - 본인의 오답노트만 삭제 가능
                    - 삭제 후 204 No Content 반환
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "삭제 성공"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "존재하지 않는 오답노트이거나 삭제 권한이 없습니다"
            )
    })
    @DeleteMapping("/reviewNotes/{reviewNoteId}")
    public ResponseEntity<Void> deleteReviewNote(
            @Parameter(
                    description = "사용자 ID (임시 인증용)",
                    required = true,
                    example = "1"
            )
            @RequestHeader("User-Id") Long userId,

            @Parameter(
                    description = "삭제할 오답노트 ID",
                    required = true,
                    example = "1"
            )
            @PathVariable Long reviewNoteId
    ) {
        reviewNoteService.deleteReviewNote(userId, reviewNoteId);
        return ResponseEntity.noContent().build();
    }
}