package com.amagetdon.learning.repository;

import com.amagetdon.learning.entity.CachedQuizChoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CachedQuizChoiceRepository extends JpaRepository<CachedQuizChoice, Long> {

    /**
     * 캐싱 퀴즈 ID로 선택지 조회
     * MCQ 타입 퀴즈 응답 시 사용
     */
    @Query("SELECT cqc FROM CachedQuizChoice cqc WHERE cqc.cachedQuiz.cachedQuizId = :cachedQuizId")
    List<CachedQuizChoice> findByCachedQuizId(@Param("cachedQuizId") Long cachedQuizId);

    /**
     * 여러 캐싱 퀴즈의 선택지 일괄 조회
     * Export 시 사용 (성능 최적화)
     */
    @Query("SELECT cqc FROM CachedQuizChoice cqc WHERE cqc.cachedQuiz.cachedQuizId IN :cachedQuizIds")
    List<CachedQuizChoice> findByCachedQuizIds(@Param("cachedQuizIds") List<Long> cachedQuizIds);
}