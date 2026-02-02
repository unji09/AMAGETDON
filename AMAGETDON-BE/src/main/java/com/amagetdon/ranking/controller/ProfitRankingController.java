package com.amagetdon.ranking.controller;

import com.amagetdon.ranking.controller.swagger.ProfitRankingControllerSwagger;
import com.amagetdon.ranking.dto.response.MyProfitRankingResponse;
import com.amagetdon.ranking.dto.response.ProfitRankingListResponse;
import com.amagetdon.ranking.service.ProfitRankingService;
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

@RestController
@RequestMapping("/ranking/profitRanking")
@RequiredArgsConstructor
public class ProfitRankingController implements ProfitRankingControllerSwagger {

    private final ProfitRankingService profitRankingService;

    @Override
    @GetMapping("/myRank")
    public ResponseEntity<Map<String, Object>> getMyProfitRanking(
            @AuthenticationPrincipal Long userId
    ) {
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

    @Override
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