package com.amagetdon.learning.repository;

import com.amagetdon.learning.entity.QuizChoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizChoiceRepository extends JpaRepository<QuizChoice, Long> {

    /**
     * 퀴즈 ID로 선택지 조회
     */
    List<QuizChoice> findByQuiz_QuizId(Long quizId);

    /**
     * 여러 퀴즈의 선택지 일괄 조회
     */
    List<QuizChoice> findByQuiz_QuizIdIn(List<Long> quizIds);
}