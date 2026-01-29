package com.amagetdon.community.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "groups")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "group_id")
    private Long id;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    //그룹명
    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "max_member_count", nullable = false)
    private Integer maxMembers;

    @Column(name = "current_member_count", nullable = false)
    private Integer currentMemberCount;

    @Column(name = "is_public", nullable = false)
    private Boolean isPublic;

    @Column(name = "join_code", length = 20, unique = true)
    private String joinCode;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "openvidu_session_id", length = 100, nullable = true)
    private String openviduSession;

    // 0명이 되면 방이 삭제 되는 로직이 필요하여 추가
    public boolean isEmpty() {
        return this.currentMemberCount != null && this.currentMemberCount <= 0;
    }

}
