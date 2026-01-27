package com.amagetdon.learning.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EqualsAndHashCode
public class UserChapterProgressId implements Serializable {

    @Column(name = "chapter_id", nullable = false)
    private Long chapterId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    public UserChapterProgressId(Long chapterId, Long userId){
        this.chapterId = chapterId;
        this.userId = userId;
    }
}
