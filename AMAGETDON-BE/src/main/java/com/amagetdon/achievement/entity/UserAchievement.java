package com.amagetdon.achievement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_achievements")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserAchievement {

    @EmbeddedId
    private UserAchievementId id;

    @Column(nullable = false)
    private boolean isAchieved = false;

    @Column
    private LocalDateTime achievedAt;

    private UserAchievement(UserAchievementId id) {
        this.id = id;
        this.isAchieved = false;
    }

    public static UserAchievement create(Long userId, Long achievementId) {
        return new UserAchievement(new UserAchievementId(userId, achievementId));
    }

    public void achieve(LocalDateTime now) {
        this.isAchieved = true;
        this.achievedAt = now;
    }

    @Embeddable
    @Getter
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class UserAchievementId implements Serializable {
        private static final long serialVersionUID = 1L;

        @Column
        private Long userId;

        @Column
        private Long achievementId;
    }
}
