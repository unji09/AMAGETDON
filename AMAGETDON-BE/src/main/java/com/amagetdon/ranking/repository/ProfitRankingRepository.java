package com.amagetdon.ranking.repository;

import com.amagetdon.ranking.entity.ProfitRanking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProfitRankingRepository extends JpaRepository<ProfitRanking,Long> {

    Optional<ProfitRanking> findByUserId(Long userId);

    @Query("SELECT pr.rank FROM ProfitRanking pr WHERE pr.userId = :userId")
    Optional<Integer> findRankingByUserId(@Param("userId") Long userId);
}
