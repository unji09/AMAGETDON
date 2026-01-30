package com.amagetdon.ranking.dto.response;

import com.amagetdon.ranking.entity.LearningRanking;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class LearningRankingListResponse {

    private Long userId;
    private Integer rank;
    private Integer totalCorrect;
    private LocalDateTime updatedAt;

    public static LearningRankingListResponse from(LearningRanking learningRanking) {
        return LearningRankingListResponse.builder()
                .userId(learningRanking.getUserId())
                .rank(learningRanking.getRank())
                .totalCorrect(learningRanking.getTotalCorrect())
                .updatedAt(learningRanking.getUpdatedAt())
                .build();
    }
}
