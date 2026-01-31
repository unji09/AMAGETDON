package com.amagetdon.achievement.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "achievements")
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long achievementId;

    @Column(nullable = false, length = 100)
    private String achievementName;

    @Column(nullable = false)
    private String achievementIcon;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String achievementContent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AchievementCategory achievementCategory;

    @Column(nullable = false)
    private Long targetValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ComparisonType comparisonType;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public boolean isAchieved(Long currentValue) {
        return switch (comparisonType) {
            case GTE -> currentValue >= targetValue;
            case LTE -> currentValue <= targetValue;
            case EQ -> currentValue.equals(targetValue);
        };
    }
}
