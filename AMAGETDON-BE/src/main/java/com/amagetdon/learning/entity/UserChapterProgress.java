package com.amagetdon.learning.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_chapter_progresses")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserChapterProgress {

    @EmbeddedId
    private UserChapterProgressId id;

    @Column(name = "is_completed", nullable = false)
    private boolean isCompleted = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "recent_updated_at", nullable = false)
    private LocalDateTime recentUpdatedAt;

    private UserChapterProgress(UserChapterProgressId id, LocalDateTime now) {
        this.id = id;
        this.isCompleted = false;
        this.createdAt = now;
        this.recentUpdatedAt = now;
    }

    public static UserChapterProgress create(Long chapterId, Long userId, LocalDateTime now) {
        return new UserChapterProgress(new UserChapterProgressId(chapterId, userId), now);
    }

    public void touch(LocalDateTime now) {
        this.recentUpdatedAt = now;
    }

    public void complete(LocalDateTime now) {
        this.isCompleted = true;
        this.completedAt = now;
        this.recentUpdatedAt = now;
    }
}