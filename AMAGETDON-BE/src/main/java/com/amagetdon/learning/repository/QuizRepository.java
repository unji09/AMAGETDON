package com.amagetdon.learning.repository;

import com.amagetdon.learning.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {

    /**
     * 전체 퀴즈 ID 목록 조회
     * 랜덤 선택용
     */
    @Query("SELECT q.quizId " +
            "FROM Quiz q")
    List<Long> findAllQuizIds();
}