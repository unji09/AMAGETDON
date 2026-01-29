package com.amagetdon.learning.service;

import com.amagetdon.learning.dto.progress.ProgressResponse;
import com.amagetdon.learning.entity.Chapter;
import com.amagetdon.learning.entity.ChapterType;
import com.amagetdon.learning.entity.UserChapterProgress;
import com.amagetdon.learning.repository.ChapterRepository;
import com.amagetdon.learning.repository.UserChapterProgressRepository;
import com.amagetdon.user.repository.UserRepository;
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

        // 진행도 없으면 요약은 0, 리스트는 빈 배열
        if (progressList.isEmpty()) {
            ProgressResponse.Summary emptySummary = buildEmptySummary();
            return new ProgressResponse(emptySummary, List.of());
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
        List<ProgressResponse.ProgressItem> progressItems = new ArrayList<>();

        for (UserChapterProgress p : progressList) {
            Long chapterId = p.getId().getChapterId();
            Chapter c = chapterMap.get(chapterId);

            // progress는 있는데 chapter가 없는 경우 스킵
            if (c == null) continue;

            // chapterType 필터
            if (chapterType != null && c.getChapterType() != chapterType) {
                continue;
            }

            progressItems.add(new ProgressResponse.ProgressItem(
                    c.getChapterId(),
                    c.getChapterType(),
                    c.getBaseChapterNo(),
                    p.isCompleted(),
                    p.getCompletedAt(),
                    p.getRecentUpdatedAt()
            ));
        }

        // 정렬 : baseChapterNo -> chapterId 순으로 정렬
        progressItems.sort((a, b) -> {
            int baseA = a.baseChapterNo() == null ? Integer.MAX_VALUE : a.baseChapterNo();
            int baseB = b.baseChapterNo() == null ? Integer.MAX_VALUE : b.baseChapterNo();

            if (baseA != baseB) return Integer.compare(baseA, baseB);
            return Long.compare(a.chapterId(), b.chapterId());
        });

        // summary 계산
        ProgressResponse.Summary summary = buildSummary(progressItems);

        return new ProgressResponse(summary, progressItems);
    }

    // summary 계산 메서드
    private ProgressResponse.Summary buildSummary(List<ProgressResponse.ProgressItem> progressItems) {
        int total = progressItems.size();
        int completed = 0;

        Map<ChapterType, int[]> counters = new EnumMap<>(ChapterType.class);
        for (ChapterType t : ChapterType.values()) {
            counters.put(t, new int[]{0, 0}); // [0]=total, [1]=completed
        }

        // 숫자 계산
        for (ProgressResponse.ProgressItem item : progressItems) {
            if (item.isCompleted()) completed++;

            ChapterType type = item.chapterType();
            int[] arr = counters.get(type);
            if (arr == null) {
                arr = new int[]{0, 0};
                counters.put(type, arr);
            }

            arr[0]++; // total++
            if (item.isCompleted()) arr[1]++; // completed++
        }

        // 응답 객체로 변환
        Map<ChapterType, ProgressResponse.TypeSummary> byType = new EnumMap<>(ChapterType.class);
        for (Map.Entry<ChapterType, int[]> e : counters.entrySet()) {
            int[] arr = e.getValue();
            byType.put(e.getKey(), new ProgressResponse.TypeSummary(arr[0], arr[1]));
        }

        return new ProgressResponse.Summary(total, completed, byType);
    }

    // summary 정보 0일 때 메서드
    private ProgressResponse.Summary buildEmptySummary() {
        Map<ChapterType, ProgressResponse.TypeSummary> byType = new EnumMap<>(ChapterType.class);
        for (ChapterType t : ChapterType.values()) {
            byType.put(t, new ProgressResponse.TypeSummary(0, 0));
        }
        return new ProgressResponse.Summary(0, 0, byType);
    }

}
