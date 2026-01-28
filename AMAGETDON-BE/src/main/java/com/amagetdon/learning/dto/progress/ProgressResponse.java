package com.amagetdon.learning.dto.progress;

import com.amagetdon.learning.entity.ChapterType;

import java.time.LocalDateTime;
import java.util.List;

public record ProgressResponse(List<ProgressItem> progresses) {

    public record ProgressItem(
            Long chapterId,
            ChapterType chapterType,
            boolean isCompleted,
            LocalDateTime completedAt,
            LocalDateTime recentUpdatedAt
    ) {}
}
