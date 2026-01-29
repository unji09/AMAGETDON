package com.amagetdon.learning.service;

import com.amagetdon.learning.dto.chapter.BaseChaptersResponse;
import com.amagetdon.learning.entity.Chapter;
import com.amagetdon.learning.entity.ChapterStatus;
import com.amagetdon.learning.entity.ChapterType;
import com.amagetdon.learning.entity.UserChapterProgress;
import com.amagetdon.learning.repository.ChapterRepository;
import com.amagetdon.learning.repository.UserChapterProgressRepository;
import com.amagetdon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChapterServiceImpl implements ChapterService{

    private final ChapterRepository chapterRepository;
    private final UserChapterProgressRepository progressRepository;
    private final UserRepository userRepository;

    @Override
    public BaseChaptersResponse getBaseChapters(Long userId) {

        List<Chapter> chapterList = chapterRepository.findAllByChapterTypeOrderByBaseChapterNoAsc(ChapterType.NORMAL);
        Map<Long, UserChapterProgress> progressMap = getProgressMap(userId);

        boolean prevCompleted = true;
        List<BaseChaptersResponse.ChapterItem> chapterItemList = new ArrayList<>();

        for(Chapter c : chapterList){
            UserChapterProgress p = progressMap.get(c.getChapterId());

            // 상태 계산
            ChapterStatus status = calculateStatus(p, prevCompleted);

            // 진행 정보가 있고, LOCKED 상태가 아닐 때만 progressDto 생성
            BaseChaptersResponse.Progress progressDto = null;
            if (p != null && status != ChapterStatus.LOCKED) {
                progressDto = new BaseChaptersResponse.Progress(
                        p.isCompleted(),
                        p.getCompletedAt(),
                        p.getRecentUpdatedAt()
                );
            }

            chapterItemList.add(new BaseChaptersResponse.ChapterItem(
                    c.getChapterId(),
                    c.getChapterType(),
                    c.getBaseChapterNo(),
                    c.getChapterTitle(),
                    c.getChapterSummary(),
                    status,
                    progressDto
            ));

            // 다음 루프 상태 갱신
            prevCompleted = ( status == ChapterStatus.COMPLETED );
        }

        return new BaseChaptersResponse(chapterItemList);
    }

    private ChapterStatus calculateStatus(UserChapterProgress progress, boolean prevCompleted) {
        if (progress != null && progress.isCompleted()) return ChapterStatus.COMPLETED;
        if (prevCompleted) return ChapterStatus.AVAILABLE;
        return ChapterStatus.LOCKED;
    }

    private Map<Long, UserChapterProgress> getProgressMap(Long userId) {
        List<UserChapterProgress> userChapterProgressList = progressRepository.findAllByIdUserId(userId);
        Map<Long, UserChapterProgress> progressMap = new HashMap<>();

        for (UserChapterProgress p : userChapterProgressList) {
            Long key = p.getId().getChapterId();
            progressMap.put(key, p);
        }
        return progressMap;
    }
}
