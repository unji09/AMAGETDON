package com.amagetdon.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "survey_questions")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Survey {

    @Id
    @Column(name = "question_id")
    private Long questionId;

    @Column(name = "question_text", nullable = false)
    private String questionText;
}
