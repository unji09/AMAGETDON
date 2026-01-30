package com.amagetdon.learning.dto.chapter;

import com.amagetdon.learning.entity.ChapterType;

import java.time.LocalDateTime;

public record ChapterDetailResponse(
        Long chapterId,
        ChapterType chapterType,
        Integer baseChapterNo,
        String chapterTitle,
        String chapterSummary,
        String chapterContent,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
