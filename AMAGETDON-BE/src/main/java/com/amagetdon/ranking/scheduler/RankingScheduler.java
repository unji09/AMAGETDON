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
    @Scheduled(cron = "0 0 0 * * *")
    public void aggregateProfitRanking() {
        log.info("===================");
        log.info("수익 랭킹 집계 스케줄러 시작");
        log.info("==================");

        try{
            profitRankingService.aggregateProfitRankings();

            log.info("==================");
            log.info("수익 랭킹 집계 스케줄러 완료");
            log.info("==================");
        } catch (Exception e){
            log.error("==================");
            log.error("수익 랭킹 집계 스케줄러 실패", e);
            log.error("==================");
        }
    }

    // 매일 자정에 학습 랭킹 집계를 실행
    @Scheduled(cron = "0 0 0 * * *")
    public void aggregateLearningRanking() {
        log.info("==================");
        log.info("학습 랭킹 집계 스케줄러 시작");
        log.info("==================");

        try{
            learningRankingService.aggregateLearningRankings();

            log.info("==================");
            log.info("학습 랭킹 집계 스케줄러 완료");
            log.info("==================");
        } catch (Exception e){
            log.error("==================");
            log.error("학습 랭킹 집계 스케줄러 실패", e);
            log.error("==================");
        }
    }
}
