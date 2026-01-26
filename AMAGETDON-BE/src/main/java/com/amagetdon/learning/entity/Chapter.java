package com.amagetdon.learning.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "chapters")
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

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
