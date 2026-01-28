package com.amagetdon.learning.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_quiz_histories")
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor
public class DailyQuizHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Long historyId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "quiz_id", nullable = false)
    private Long quizId;

    @Column(name = "quiz_date", nullable = false)
    private LocalDate quizDate;

    @Column(name = "quiz_sequence", nullable = false)
    private Integer quizSequence;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect;

    @LastModifiedDate
    @Column(name = "answered_at", nullable = false)
    private LocalDateTime answeredAt;

    @PrePersist
    protected void onCreate() {
        if (answeredAt == null) {
            answeredAt = LocalDateTime.now();
        }
        if (quizDate == null) {
            quizDate = answeredAt.toLocalDate();
        }
    }

    public DailyQuizHistory(Long userId, Long quizId, Integer quizSequence, Boolean isCorrect) {
        this.userId = userId;
        this.quizId = quizId;
        this.quizSequence = quizSequence;
        this.isCorrect = isCorrect;
    }
}