package com.amagetdon.user.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class User {

    public static final Integer INITIAL_TOTAL_POINTS = 0;
    public static final Long INITIAL_BALANCE = 3000000L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column
    private String password;

    @Email
    @Column(nullable = false, length = 50)
    private String email;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvestmentType investmentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoginType loginType;

    @Column
    private Long socialId;

    @Column
    private String currentTitle;

    @Builder.Default
    @Column
    private Integer totalPoints = INITIAL_TOTAL_POINTS;

    @Builder.Default
    @Column(nullable = false)
    private Long balance = INITIAL_BALANCE;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public void updateInvestmentType(InvestmentType investmentType) {
        this.investmentType = investmentType;
    }

    public void updatePassword(String password) {
        this.password = password;
    }

    public void updateCurrentTitle(String newTitle) {
        this.currentTitle = newTitle;
    }

    public void updateUser(@Email String email, String password, String nickname) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
    }

    public void deductBalance(Long amount) {
        if (this.balance < amount) {
            throw new IllegalArgumentException("잔액이 부족합니다.");
        }
        this.balance -= amount;
    }

    public void addBalance(Long amount) {
        this.balance += amount;
    }
}
