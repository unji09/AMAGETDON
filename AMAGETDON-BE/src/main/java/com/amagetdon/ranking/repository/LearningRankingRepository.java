package com.amagetdon.ranking.repository;

import com.amagetdon.ranking.entity.LearningRanking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface LearningRankingRepository extends JpaRepository<LearningRanking, Long> {
    Optional<LearningRanking> findByUserId(Long userId);

    @Query("SELECT lr.rank FROM LearningRanking lr WHERE lr.userId = :userId")
    Optional<Integer> findRankingByUserId(@Param("userId") Long userId);
}
