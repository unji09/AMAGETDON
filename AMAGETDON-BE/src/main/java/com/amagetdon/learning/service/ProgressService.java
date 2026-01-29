package com.amagetdon.learning.service;

import com.amagetdon.learning.dto.progress.ProgressResponse;
import com.amagetdon.learning.entity.ChapterType;
import com.amagetdon.learning.repository.ChapterRepository;
import com.amagetdon.learning.repository.UserChapterProgressRepository;
import com.amagetdon.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProgressService {
    private final UserRepository userRepository;
    private final UserChapterProgressRepository userChapterProgressRepository;
    private final ChapterRepository chapterRepository;

    public ProgressResponse getProgress(Long userId, ChapterType chapterType, boolean onlyCompleted){

        return null;
    }

}
