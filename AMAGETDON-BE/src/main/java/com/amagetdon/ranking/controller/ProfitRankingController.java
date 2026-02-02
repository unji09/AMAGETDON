package com.amagetdon.ranking.controller;

import com.amagetdon.ranking.dto.response.MyProfitRankingResponse;
import com.amagetdon.ranking.dto.response.ProfitRankingListResponse;
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

import java.util.HashMap;
import java.util.Map;

@Tag(name = "수익 랭킹", description = "수익 랭킹 관련 API")
@RestController
@RequestMapping("/ranking/profitRanking")
@RequiredArgsConstructor
public class ProfitRankingController {

    private final ProfitRankingService profitRankingService;

    @Operation(summary = "내 수익 랭킹 조회", description = "로그인한 사용자의 수익 랭킹 정보를 조회합니다.")
    @GetMapping("/myRank")
    public ResponseEntity<Map<String, Object>> getMyProfitRanking(@AuthenticationPrincipal Long userId){
        MyProfitRankingResponse response = profitRankingService.getMyProfitRanking(userId);

        Map<String, Object> result = new HashMap<>();
        if (response == null) {
            result.put("success", true);
            result.put("message", "아직 랭킹 정보가 없습니다. 주식 거래를 시작해보세요!");
            result.put("data", null);
        } else {
            result.put("data", response);
        }

        return ResponseEntity.ok(result);
    }

    @Operation(summary = "수익 랭킹 목록 조회", description = "전체 수익 랭킹 목록을 페이징하여 조회합니다.")
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> getProfitRankings(
            @PageableDefault(size = 10, sort = "rank") Pageable pageable,
            @AuthenticationPrincipal Long userId
    ) {
        Page<ProfitRankingListResponse> rankings = profitRankingService.getProfitRankings(pageable, userId);

        Map<String, Object> result = new HashMap<>();
        Map<String, Object> data = new HashMap<>();

        data.put("rankings", rankings.getContent());
        data.put("updatedAt", rankings.getContent().isEmpty() ? null : rankings.getContent().get(0).getUpdatedAt());
        data.put("totalElements", rankings.getTotalElements());
        data.put("currentPage", rankings.getNumber());

        result.put("data", data);

        return ResponseEntity.ok(result);
    }
}