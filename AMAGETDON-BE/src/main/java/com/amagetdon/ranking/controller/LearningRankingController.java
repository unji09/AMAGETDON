package com.amagetdon.ranking.controller;

import com.amagetdon.ranking.dto.response.MyLearningRankingResponse;
import com.amagetdon.ranking.entity.LearningRanking;
import com.amagetdon.ranking.service.LearningRankingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "학습 랭킹", description = "학습 랭킹 관련 API")
@RestController
@RequestMapping("/rankings/learning")
@RequiredArgsConstructor
public class LearningRankingController {

    private final LearningRankingService learningRankingService;

    @Operation(summary = "내 학습 랭킹 조회", description = "로그인한 사용자의 학습 랭킹 정보를 조회합니다.")
    @GetMapping("/me")
    public ResponseEntity<MyLearningRankingResponse> getMyLearningRanking(
            @AuthenticationPrincipal Long userId
    ) {

        LearningRanking learningRanking = learningRankingService.getMyLearningRanking(userId);
        MyLearningRankingResponse response = MyLearningRankingResponse.from(learningRanking);
        return ResponseEntity.ok(response);
    }
}