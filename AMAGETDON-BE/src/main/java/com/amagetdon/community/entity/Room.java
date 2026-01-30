package com.amagetdon.community.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.time.LocalDateTime;

@Entity
@Table(name = "rooms")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Long id;

    @Column(nullable = false)
    private Long ownerId;

    //그룹명
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

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(length = 100, nullable = true)
    private String openviduSessionId;

    public void incrementCurrentMemberCount() {
        this.currentMemberCount++;
    }

    public void decrementCurrentMemberCount() {
        if(this.currentMemberCount > 0) {
            this.currentMemberCount--;
        }
    }

    // 0명이 되면 방이 삭제 되는 로직이 필요하여 추가
    public boolean isEmpty() {
        return this.currentMemberCount != null && this.currentMemberCount <= 0;
    }


}
