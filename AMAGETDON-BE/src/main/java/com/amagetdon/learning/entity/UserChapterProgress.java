package com.amagetdon.learning.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_chapter_progresses")
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserChapterProgress {

    @EmbeddedId
    private UserChapterProgressId id;

    @Column(name = "is_completed", nullable = false)
    private boolean isCompleted = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "recent_updated_at", nullable = false)
    private LocalDateTime recentUpdatedAt;

    private UserChapterProgress(UserChapterProgressId id) {
        this.id = id;
        this.isCompleted = false;
    }

    public static UserChapterProgress create(Long chapterId, Long userId) {
        return new UserChapterProgress(new UserChapterProgressId(chapterId, userId));
    }

    public void complete(LocalDateTime now) {
        this.isCompleted = true;
        this.completedAt = now;
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