package com.amagetdon.learning.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "cached_quiz_choices")
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor
public class CachedQuizChoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cached_choice_id")
    private Long cachedChoiceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cached_quiz_id", nullable = false)
    private CachedQuiz cachedQuiz;

    @Column(name = "choice_no", nullable = false)
    private Integer choiceNo;

    @Column(name = "choice_text", nullable = false, length = 300)
    private String choiceText;

    @Column(name = "is_answer", nullable = false)
    private Boolean isAnswer;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // 생성자 (FastAPI에서 저장 시 사용)
    public CachedQuizChoice(
            CachedQuiz cachedQuiz,
            String choiceText,
            Integer choiceNo,
            Boolean isAnswer
    ) {
        this.cachedQuiz = cachedQuiz;
        this.choiceText = choiceText;
        this.choiceNo = choiceNo;
        this.isAnswer = isAnswer;
    }
}