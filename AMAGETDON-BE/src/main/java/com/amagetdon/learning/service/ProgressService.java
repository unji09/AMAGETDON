package com.amagetdon.learning.service;

import com.amagetdon.learning.dto.progress.ProgressResponse;
import com.amagetdon.learning.entity.Chapter;
import com.amagetdon.learning.entity.ChapterType;
import com.amagetdon.learning.entity.UserChapterProgress;
import com.amagetdon.learning.repository.ChapterRepository;
import com.amagetdon.learning.repository.UserChapterProgressRepository;
import com.amagetdon.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

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

        // 챕터 id 중복 제거하여 수집
        Set<Long> chapterIdSet = new HashSet<>();
        for (UserChapterProgress p : progressList) {
            chapterIdSet.add(p.getId().getChapterId());
        }

        // 챕터 정보
        List<Chapter> chapters = chapterRepository.findAllByChapterIdIn(chapterIdSet);
        Map<Long, Chapter> chapterMap = new HashMap<>();
        for (Chapter c : chapters) {
            chapterMap.put(c.getChapterId(), c);
        }

        // response 값 조합
        List<ProgressResponse.ProgressItem> items = new ArrayList<>();

        for (UserChapterProgress p : progressList) {
            Long chapterId = p.getId().getChapterId();
            Chapter c = chapterMap.get(chapterId);

            // progress는 있는데 chapter가 없는 경우 스킵
            if (c == null) continue;

            // chapterType 필터
            if (chapterType != null && c.getChapterType() != chapterType) {
                continue;
            }

            items.add(new ProgressResponse.ProgressItem(
                    c.getChapterId(),
                    c.getChapterType(),
                    p.isCompleted(),
                    p.getCompletedAt(),
                    p.getRecentUpdatedAt()
            ));
        }


        return null;
    }

}
