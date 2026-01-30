package com.amagetdon.learning.repository;

import com.amagetdon.learning.entity.CachedQuiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CachedQuizRepository extends JpaRepository<CachedQuiz, Long> {

    /**
     * 미사용 캐싱 퀴즈 중 랜덤 1개 조회
     * 100개 초과 시 사용
     */
    @Query(value = "SELECT * FROM cached_quizzes WHERE is_used = false ORDER BY RAND() LIMIT 1",
            nativeQuery = true)
    Optional<CachedQuiz> findRandomUnusedQuiz();

    /**
     * 미사용 캐싱 퀴즈 개수 조회
     * 생성 여부 판단용 (1000개 미만인지 확인)
     */
    Integer countByIsUsed(Boolean isUsed);

    /**
     * 전체 캐싱 퀴즈 개수 조회
     * Export 트리거 확인용 (50개 단위)
     */
    @Query("SELECT COUNT(cq) FROM CachedQuiz cq")
    Long countAllCachedQuizzes();

    /**
     * Export용: 모든 캐싱 퀴즈 조회
     * CSV 파일 생성 시 사용
     */
    @Query("SELECT cq FROM CachedQuiz cq ORDER BY cq.cachedQuizId ASC")
    List<CachedQuiz> findAllForExport();
}