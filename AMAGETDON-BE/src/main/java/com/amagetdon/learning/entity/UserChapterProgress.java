package com.amagetdon.learning.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
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

    @Embeddable
    @Getter
    @NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA용 기본 생성자
    @AllArgsConstructor // 직접 생성 및 팩토리 메서드용 전체 생성자
    @EqualsAndHashCode
    public static class UserChapterProgressId implements Serializable {
        private static final long serialVersionUID = 1L;

        @Column(name = "chapter_id")
        private Long chapterId;

        @Column(name = "user_id")
        private Long userId;
    }
}