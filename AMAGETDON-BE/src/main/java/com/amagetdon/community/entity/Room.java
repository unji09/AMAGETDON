package com.amagetdon.community.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "rooms")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Long id;

    @Column(nullable = false)
    private Long ownerId;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false)
    private Integer maxMemberCount;

    @Column(nullable = false)
    private Integer currentMemberCount;

    @Column(nullable = false)
    private Boolean isPublic;

    @Column(length = 20, unique = true)
    private String joinCode;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(length = 100)
    private String openviduSessionId;

    public void incrementCurrentMemberCount() {
        this.currentMemberCount++;
    }

    public void decrementCurrentMemberCount() {
        if (this.currentMemberCount > 0) {
            this.currentMemberCount--;
        }
    }

    public void syncCurrentMemberCount(int actualCount) {
        this.currentMemberCount = Math.max(0, actualCount);
    }

    public boolean isEmpty() {
        return this.currentMemberCount != null && this.currentMemberCount <= 0;
    }

    public void updateOpenViduSessionId(String newSessionId) {
        this.openviduSessionId = newSessionId;
    }
}