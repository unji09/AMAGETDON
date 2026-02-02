package com.amagetdon.ranking.dto.response;

import com.amagetdon.ranking.entity.LearningRanking;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class MyLearningRankingResponse {

    private Long rankingId;
    private Long userId;
    private String nickname;
    private String currentTitle;
    private Integer rank;
    private Integer totalCorrect;
    private LocalDateTime updatedAt;

    public static MyLearningRankingResponse from(LearningRanking learningRanking) {
        return MyLearningRankingResponse.builder()
                .userId(learningRanking.getUserId())
                .rank(learningRanking.getRank())
                .totalCorrect(learningRanking.getTotalCorrect())
                .updatedAt(learningRanking.getUpdatedAt())
                .build();
    }
}
