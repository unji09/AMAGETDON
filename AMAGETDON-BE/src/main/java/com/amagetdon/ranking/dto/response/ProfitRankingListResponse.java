package com.amagetdon.ranking.dto.response;

import com.amagetdon.ranking.entity.ProfitRanking;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class ProfitRankingListResponse {

    private Long userId;
    private Integer rank;
    private BigDecimal totalProfit;
    private LocalDateTime updatedAt;

    public static ProfitRankingListResponse from(ProfitRanking profitRanking) {
        return ProfitRankingListResponse.builder()
                .userId(profitRanking.getUserId())
                .rank(profitRanking.getRank())
                .totalProfit(profitRanking.getTotalProfit())
                .updatedAt(profitRanking.getUpdatedAt())
                .build();
    }
}
