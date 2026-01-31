package com.amagetdon.ranking.controller;

import com.amagetdon.ranking.dto.response.MyProfitRankingResponse;
import com.amagetdon.ranking.dto.response.ProfitRankingListResponse;
import com.amagetdon.ranking.entity.ProfitRanking;
import com.amagetdon.ranking.service.ProfitRankingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "수익 랭킹", description = "수익 랭킹 관련 API")
@RestController
@RequestMapping("/rankings/profit")
@RequiredArgsConstructor
public class ProfitRankingController {

    private final ProfitRankingService profitRankingService;

    @Operation(summary = "내 수익 랭킹 조회", description = "로그인한 사용자의 수익 랭킹 정보를 조회합니다.")
    @GetMapping("/me")
    public ResponseEntity<MyProfitRankingResponse> getMyProfitRanking(@AuthenticationPrincipal Long userId){

        ProfitRanking profitRanking = profitRankingService.getMyProfitRanking(userId);
        MyProfitRankingResponse response = MyProfitRankingResponse.from(profitRanking);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "수익 랭킹 목록 조회", description = "전체 수익 랭킹 목록을 페이징하여 조회합니다.")
    @GetMapping
    public ResponseEntity<Page<ProfitRankingListResponse>> getProfitRankings(
            @PageableDefault(size = 20, sort = "rank") Pageable pageable
    ) {
        Page<ProfitRanking> rankings = profitRankingService.getProfitRankings(pageable);
        Page<ProfitRankingListResponse> response = rankings.map(ProfitRankingListResponse::from);
        return ResponseEntity.ok(response);
    }
}
