package com.amagetdon.learning.repository;

import com.amagetdon.learning.entity.ReviewNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewNoteRepository extends JpaRepository<ReviewNote, Long> {

    /**
     * 사용자의 오답노트 조회 (Quiz 정보 포함)
     * Fetch Join으로 N+1 방지
     */
    @Query("SELECT rn FROM ReviewNote rn " +
            "JOIN FETCH rn.quiz q " +
            "WHERE rn.userId = :userId " +
            "ORDER BY rn.createdAt DESC")
    List<ReviewNote> findByUserIdWithQuiz(@Param("userId") Long userId);

    /**
     * 사용자의 남은 오답노트 개수 조회
     * Response에 반환용
     */
    @Query("SELECT COUNT(rn) FROM ReviewNote rn WHERE rn.userId = :userId")
    Integer countByUserId(@Param("userId") Long userId);

    /**
     * 특정 사용자의 특정 퀴즈 오답노트 전체 조회
     * 기존 중복 데이터 대응을 위해 List로 반환
     */
    @Query("""
        SELECT rn
        FROM ReviewNote rn
        WHERE rn.userId = :userId
          AND rn.quiz.quizId = :quizId
        """)
    List<ReviewNote> findAllByUserAndQuiz(
            @Param("userId") Long userId,
            @Param("quizId") Long quizId
    );

    @Modifying
    @Query(value = """
    INSERT IGNORE INTO review_notes (user_id, quiz_id, created_at)
    VALUES (:userId, :quizId, CURRENT_TIMESTAMP)
    """, nativeQuery = true)
    int insertIfAbsent(
            @Param("userId") Long userId,
            @Param("quizId") Long quizId
    );
}