package com.amagetdon.learning.repository;

import com.amagetdon.learning.entity.UserChapterProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserChapterProgressRepository extends JpaRepository<UserChapterProgress, UserChapterProgress.UserChapterProgressId> {

    List<UserChapterProgress> findAllByIdUserId(Long userId);
    Optional<UserChapterProgress> findByIdUserIdAndIdChapterId(Long userId, Long chapterId);

}
