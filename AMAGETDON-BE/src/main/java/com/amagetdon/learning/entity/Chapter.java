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
    @Column(name = "chapter_id")
    private Long chapterId;

    @Enumerated(EnumType.STRING)
    @Column(name = "chapter_type", nullable = false)
    private ChapterType chapterType;

    @Column(name = "base_chapter_no")
    private Integer baseChapterNo;

    @Column(name = "chapter_title", length = 100, nullable = false)
    private String chapterTitle;

    @Column(name = "chapter_summary", columnDefinition = "TEXT")
    private String chapterSummary;

    @Column(name = "chapter_content", columnDefinition = "TEXT", nullable = false)
    private String chapterContent;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
