package com.amagetdon.learning.repository;

import com.amagetdon.learning.entity.DailyQuizHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DailyQuizHistoryRepository extends JpaRepository<DailyQuizHistory, Long> {

    /**
     * 오늘 푼 퀴즈 ID 목록 조회
     * 중복 방지용
     */
    @Query("SELECT dqh.quizId " +
            "FROM DailyQuizHistory dqh " +
            "WHERE dqh.userId = :userId AND dqh.quizDate = :quizDate")
    List<Long> findQuizIdsByUserIdAndQuizDate(
            @Param("userId") Long userId,
            @Param("quizDate") LocalDate quizDate
    );

    /**
     * 오늘 푼 퀴즈 개수 조회
     * 진행도 확인용
     */
    Integer countByUserIdAndQuizDate(Long userId, LocalDate quizDate);

    /**
     * 특정 퀴즈를 오늘 이미 풀었는지 확인
     * 중복 제출 방지용
     */
    boolean existsByUserIdAndQuizIdAndQuizDate(
            Long userId,
            Long quizId,
            LocalDate quizDate
    );

    /**
     * 오늘 푼 퀴즈 최대 sequence 조회
     * 다음 sequence 계산용
     */
    @Query("SELECT MAX(dqh.quizSequence) " +
            "FROM DailyQuizHistory dqh " +
            "WHERE dqh.userId = :userId AND dqh.quizDate = :quizDate")
    Integer findMaxSequenceByUserIdAndQuizDate(
            @Param("userId") Long userId,
            @Param("quizDate") LocalDate quizDate
    );
}