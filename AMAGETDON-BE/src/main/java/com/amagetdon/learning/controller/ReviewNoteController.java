package com.amagetdon.learning.controller;

import com.amagetdon.learning.dto.reviewnote.ReviewNoteListResponse;
import com.amagetdon.learning.service.ReviewNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class ReviewNoteController {

    private final ReviewNoteService reviewNoteService;

    /**
     * 오답노트 목록 조회
     * GET /api/quizzes/reviewNotes
     */
    @GetMapping("/reviewNotes")
    public ResponseEntity<ReviewNoteListResponse> getReviewNotes(
            // TODO(민규): 인증 구현 후 변경
            @RequestHeader("User-Id") Long userId
    ) {
        ReviewNoteListResponse response = reviewNoteService.getReviewNotes(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 오답노트 삭제
     * DELETE /api/quizzes/reviewNotes/{reviewNoteId}
     */
    @DeleteMapping("/reviewNotes/{reviewNoteId}")
    public ResponseEntity<Void> deleteReviewNote(
            // TODO(민규): 인증 구현 후 변경
            @RequestHeader("User-Id") Long userId,
            @PathVariable Long reviewNoteId
    ) {
        reviewNoteService.deleteReviewNote(userId, reviewNoteId);
        return ResponseEntity.noContent().build();
    }
}