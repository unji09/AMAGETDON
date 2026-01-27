package com.amagetdon.learning.repository;

import com.amagetdon.learning.entity.ReviewNote;
import org.springframework.data.jpa.repository.JpaRepository;
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
     * 특정 퀴즈가 오답노트에 이미 있는지 확인
     * 중복 저장 방지용
     */
    boolean existsByUserIdAndQuiz_QuizId(Long userId, Long quizId);
}