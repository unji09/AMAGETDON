package com.amagetdon.learning.repository;

import com.amagetdon.learning.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {

    /**
     * 전체 퀴즈 ID 목록 조회
     * 랜덤 선택용
     */
    @Query("SELECT q.quizId FROM Quiz q")
    List<Long> findAllQuizIds();

    /**
     * 챕터별 OX 퀴즈 조회 (4문제)
     */
    @Query(value = "SELECT * FROM quizzes q " +
            "WHERE q.chapter_id = :chapterId " +
            "AND q.quiz_type = :quizType " +
            "ORDER BY RAND() " +
            "LIMIT :limit",
            nativeQuery = true)
    List<Quiz> findRandomQuizzesByChapterAndType(
            @Param("chapterId") Long chapterId,
            @Param("quizType") String quizType,
            @Param("limit") int limit
    );

    /**
     * 챕터별 전체 퀴즈 개수 조회
     */
    @Query("SELECT COUNT(q) FROM Quiz q WHERE q.chapterId = :chapterId")
    long countByChapterId(@Param("chapterId") Long chapterId);
}
