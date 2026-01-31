package com.amagetdon.ranking.service;

import com.amagetdon.ranking.entity.ProfitRanking;
import com.amagetdon.ranking.repository.ProfitRankingRepository;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfitRankingService {

    private final ProfitRankingRepository profitRankingRepository;
    private final UserRepository userRepository;
    private final ProfitCalculationService profitCalculationService;

    // 매일 자정에 실행되는 수익 랭킹 집계 로직
    @Transactional
    public void aggregateProfitRankings() {
        log.info("=== 수익 랭킹 집계 시작: {} ===", LocalDateTime.now());

        try {
            // 기존 랭킹 데이터 모두 삭제
            profitRankingRepository.deleteAll();
            log.info("기존 랭킹 데이터 삭제 완료");

            // 모든 유저의 총 수익 계산
            Map<Long, BigDecimal> userProfitMap = calculateAllUserProfits();
            log.info("총 {}명의 유저 수익 계산 완료", userProfitMap.size());

            // 수익 순으로 정렬하여 순위 매기기
            List<ProfitRanking> rankings = createRankingsFromProfitMap(userProfitMap);
            log.info("랭킹 생성 완료:: {} 건", rankings.size());

            // DB에 저장
            profitRankingRepository.saveAll(rankings);
            log.info("=== 수익 랭킹 집계 완료: {} ===", LocalDateTime.now());
        } catch (Exception e) {
            log.error("수익 랭킹 집계 중 오류 발생", e);
            throw e;
        }
    }

    // 모든 유저의 순수 투자 수익을 계산
    private Map<Long, BigDecimal> calculateAllUserProfits() {
        Map<Long, BigDecimal> userProfitMap = new HashMap<>();

        // 모든 유저 조회
        List<User> users = userRepository.findAll();

        for(User user : users) {
            try{
                BigDecimal profit = profitCalculationService.calculateUserProfit(user.getUserId());
                userProfitMap.put(user.getUserId(), profit);
            } catch (Exception e) {
                log.error("유저 {} 수익 계산 실패", user.getUserId(), e);

                userProfitMap.put(user.getUserId(), BigDecimal.ZERO);
            }
        }

        return userProfitMap;
    }

    // 수익 맵을 기반으로 랭킹 리스트를 생성
    private List<ProfitRanking> createRankingsFromProfitMap(Map<Long, BigDecimal> userProfitMap) {
        List<ProfitRanking> rankings = new ArrayList<>();

        // 수익 순으로 정렬(내림차순)
        List<Map.Entry<Long, BigDecimal>> sortedEntries = userProfitMap.entrySet().stream()
                .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
                .toList();

        // 순위 매기기
        int rank = 1;
        LocalDateTime now = LocalDateTime.now();

        for(Map.Entry<Long, BigDecimal> entry : sortedEntries) {
            ProfitRanking ranking = ProfitRanking.builder()
                    .userId(entry.getKey())
                    .rank(rank++)
                    .totalProfit(entry.getValue())
                    .updatedAt(now)
                    .build();
            rankings.add(ranking);
        }

        return rankings;
    }

    @Transactional(readOnly = true)
    public ProfitRanking getMyProfitRanking(Long userId) {
        return profitRankingRepository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "수익 랭킹 정보를 찾을 수 없습니다."
                ));
    }
}
