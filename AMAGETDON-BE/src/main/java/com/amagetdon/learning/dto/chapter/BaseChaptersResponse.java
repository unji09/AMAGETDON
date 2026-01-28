package com.amagetdon.learning.dto.chapter;

import com.amagetdon.learning.entity.ChapterStatus;
import com.amagetdon.learning.entity.ChapterType;

import java.time.LocalDateTime;
import java.util.List;

public record BaseChaptersResponse(List<ChapterItem> chapters) {
    public record ChapterItem(
            Long chapterId,
            ChapterType chapterType,
            Integer baseChapterNo,
            String chapterTitle,
            String chapterSummary,
            ChapterStatus status,
            Progress progress
    ) {}

    public record Progress(
            boolean isCompleted,
            LocalDateTime completedAt,
            LocalDateTime recentUpdatedAt
    ) {}
}
