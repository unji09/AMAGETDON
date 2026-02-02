package com.amagetdon.ranking.controller.swagger;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.Map;

@Tag(name = "학습 랭킹", description = "학습 랭킹 관련 API")
public interface LearningRankingControllerSwagger {

    @Operation(
            summary = "내 학습 랭킹 조회",
            description = "로그인한 사용자의 학습 랭킹 정보를 조회합니다. 랭킹 정보가 없는 경우 null을 반환합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패", content = @Content)
    })
    ResponseEntity<Map<String, Object>> getMyLearningRanking(
            @Parameter(hidden = true) @AuthenticationPrincipal Long userId
    );

    @Operation(
            summary = "학습 랭킹 목록 조회",
            description = "전체 학습 랭킹 목록을 페이징하여 조회합니다. 기본 10개씩 조회됩니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패", content = @Content)
    })
    ResponseEntity<Map<String, Object>> getLearningRankings(
            @Parameter(description = "페이징 정보 (page, size, sort)", example = "page=0&size=10&sort=rank")
            Pageable pageable,
            @Parameter(hidden = true) @AuthenticationPrincipal Long userId
    );
}