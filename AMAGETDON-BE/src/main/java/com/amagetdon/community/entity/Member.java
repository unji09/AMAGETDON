package com.amagetdon.community.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;


@Entity
@Table(name = "members",
// ✅ FIXED: unique constraint 제거 (hard delete 사용)
        indexes = {@Index(name = "idx_member_room_user_active", columnList = "roomId, userId, isActive")})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "member_id")
    private Long id;

    @Column(nullable = false)
    private Long roomId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    // ✅ DEPRECATED: soft delete 대신 hard delete 사용
    // 이 메서드는 더 이상 사용하지 않음
    @Deprecated
    public void deactivate() {
        this.isActive = false;
    }

}