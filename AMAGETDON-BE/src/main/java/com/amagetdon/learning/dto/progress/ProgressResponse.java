package com.amagetdon.learning.dto.progress;

import com.amagetdon.learning.entity.ChapterType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record ProgressResponse(
        Summary summary,
        List<ProgressItem> progresses
) {
    public record Summary(
        int totalChapters,
        int completedChapters,
        Map<ChapterType, TypeSummary> byType
    ) {}

    public record TypeSummary(
        int total,
        int completed
    ) {}

    public record ProgressItem(
            Long chapterId,
            ChapterType chapterType,
            Integer baseChapterNo,
            boolean isCompleted,
            LocalDateTime completedAt,
            LocalDateTime recentUpdatedAt
    ) {}
}
