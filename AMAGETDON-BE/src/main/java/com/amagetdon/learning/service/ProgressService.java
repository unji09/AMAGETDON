package com.amagetdon.learning.service;

import com.amagetdon.learning.dto.progress.ProgressResponse;
import com.amagetdon.learning.entity.ChapterType;
import com.amagetdon.learning.entity.UserChapterProgress;
import com.amagetdon.learning.repository.ChapterRepository;
import com.amagetdon.learning.repository.UserChapterProgressRepository;
import com.amagetdon.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProgressService {
    private final UserRepository userRepository;
    private final UserChapterProgressRepository userChapterProgressRepository;
    private final ChapterRepository chapterRepository;

    public ProgressResponse getProgress(Long userId, ChapterType chapterType, boolean onlyCompleted){

        // 유저 검증
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("존재하지 않는 회원입니다.");
        }

        // 유저 progress 전체 조회
        List<UserChapterProgress> progressList = userChapterProgressRepository.findAllByIdUserId(userId);

        // completed 필터 (완료된 진행도만)
        if (onlyCompleted) {
            List<UserChapterProgress> completedOnly = new ArrayList<>();
            for (UserChapterProgress p : progressList) {
                if (p.isCompleted()) completedOnly.add(p);
            }
            progressList = completedOnly;
        }

        // 진행도 없으면 빈 배열 반환
        if (progressList.isEmpty()) {
            return new ProgressResponse(Collections.emptyList());
        }


        return null;
    }

}
