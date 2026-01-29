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
    @Column(name = "group_id")
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

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(length = 100, nullable = true)
    private String openviduSessionId;

    // 0명이 되면 방이 삭제 되는 로직이 필요하여 추가
    public boolean isEmpty() {
        return this.currentMemberCount != null && this.currentMemberCount <= 0;
    }

}
