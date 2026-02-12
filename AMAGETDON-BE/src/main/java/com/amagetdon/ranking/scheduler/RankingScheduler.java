package com.amagetdon.ranking.scheduler;

import com.amagetdon.ranking.service.LearningRankingService;
import com.amagetdon.ranking.service.ProfitRankingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RankingScheduler {

    private final ProfitRankingService profitRankingService;
    private final LearningRankingService learningRankingService;

    // 매일 자정에 수익 랭킹 집계를 실행
    @Scheduled(fixedRate = 60000)
    public void aggregateProfitRanking() {
        log.info("수익 랭킹 집계 스케줄러 시작");

        try{
            profitRankingService.aggregateProfitRankings();

            log.info("수익 랭킹 집계 스케줄러 완료");
        } catch (Exception e){
            log.error("수익 랭킹 집계 스케줄러 실패", e);
        }
    }

    // 매일 자정에 학습 랭킹 집계를 실행
    @Scheduled(fixedRate = 60000)
    public void aggregateLearningRanking() {

        try{
            learningRankingService.aggregateLearningRankings();

        } catch (Exception e){
            log.error("학습 랭킹 집계 스케줄러 실패", e);
        }
    }
}
