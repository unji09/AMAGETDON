package com.amagetdon.learning.controller;

import com.amagetdon.learning.dto.reviewnote.ReviewNoteListResponse;
import com.amagetdon.learning.service.ReviewNoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "오답노트", description = "틀린 문제 관리 및 복습 API")
@RestController
@RequestMapping("/api/quizzes")
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