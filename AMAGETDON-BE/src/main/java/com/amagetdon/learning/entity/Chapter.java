package com.amagetdon.learning.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "chapters")
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Chapter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column
    private Long chapterId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChapterType chapterType;

    @Column
    private Integer baseChapterNo;

    @Column(length = 100, nullable = false)
    private String chapterTitle;

    @Column(columnDefinition = "TEXT")
    private String chapterSummary;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String chapterContent;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
