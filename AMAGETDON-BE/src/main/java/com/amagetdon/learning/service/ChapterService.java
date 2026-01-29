package com.amagetdon.learning.service;

import com.amagetdon.learning.dto.chapter.BaseChaptersResponse;
import com.amagetdon.learning.dto.chapter.ChapterDetailResponse;
import com.amagetdon.learning.dto.chapter.SideChaptersResponse;
import com.amagetdon.learning.entity.Chapter;
import com.amagetdon.learning.entity.ChapterStatus;
import com.amagetdon.learning.entity.ChapterType;
import com.amagetdon.learning.entity.UserChapterProgress;
import com.amagetdon.learning.repository.ChapterRepository;
import com.amagetdon.learning.repository.UserChapterProgressRepository;
import com.amagetdon.user.entity.InvestmentType;
import com.amagetdon.user.entity.User;
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
public class ChapterService{

    private final ChapterRepository chapterRepository;
    private final UserChapterProgressRepository progressRepository;
    private final UserRepository userRepository;

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

    public ChapterDetailResponse getChapterDetail(Long userId, Long chapterId) {

        // 챕터 존재 여부 확인
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("챕터를 찾을 수 없습니다."));

        // LOCKED 여부 판별
        ChapterStatus status = resolveChapterStatus(userId, chapter);
        if (status == ChapterStatus.LOCKED) {
            throw new SecurityException("잠긴 챕터는 조회할 수 없습니다.");
        }

        return new ChapterDetailResponse(
                chapter.getChapterId(),
                chapter.getChapterType(),
                chapter.getBaseChapterNo(),
                chapter.getChapterTitle(),
                chapter.getChapterSummary(),
                chapter.getChapterContent(),
                chapter.getCreatedAt(),
                chapter.getUpdatedAt()
        );
    }

    private ChapterStatus resolveChapterStatus(Long userId, Chapter chapter) {

        // 챕터 타입에 따른 리스트 생성
        List<Chapter> targetChapters = (chapter.getChapterType() == ChapterType.NORMAL)
                ? chapterRepository.findAllByChapterTypeOrderByBaseChapterNoAsc(ChapterType.NORMAL)
                : chapterRepository.findAllByChapterTypeOrderByChapterIdAsc(chapter.getChapterType());

        // 진행도 맵 가져오기, 상태 판별 루프
        Map<Long, UserChapterProgress> progressMap = getProgressMap(userId);
        return calculateStatusInSequence(targetChapters, progressMap, chapter.getChapterId());
    }

    // 주어진 리스트를 순차적으로 탐색하며 타겟 챕터의 상태를 계산
    private ChapterStatus calculateStatusInSequence(List<Chapter> chapters, Map<Long, UserChapterProgress> progressMap, Long targetChapterId) {
        boolean prevCompleted = true;

        for (Chapter c : chapters) {
            UserChapterProgress p = progressMap.get(c.getChapterId());
            ChapterStatus s = calculateStatus(p, prevCompleted);

            // 우리가 찾는 챕터라면 즉시 반환
            if (c.getChapterId().equals(targetChapterId)) {
                return s;
            }
            // 다음 챕터 판단을 위해 현재 챕터의 완료 여부 저장
            prevCompleted = (s == ChapterStatus.COMPLETED);
        }
        return ChapterStatus.LOCKED;
    }

    public SideChaptersResponse getSideChapters(Long userId, ChapterType chapterType) {

        //유저 조회, 사용자 투자 성향 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        InvestmentType userInvestmentType = user.getInvestmentType();

        // requestedType이 없으면 유저 성향 기준
        ChapterType requestedType = (chapterType != null)
                ? chapterType
                : ChapterType.valueOf(userInvestmentType.name());

        // 해당 타입의 사이드 챕터 조회 (기본 챕터와 동일 로직)
        List<Chapter> chapterList = chapterRepository.findAllByChapterTypeOrderByChapterIdAsc(requestedType);
        Map<Long, UserChapterProgress> progressMap = getProgressMap(userId);

        boolean prevCompleted = true;
        List<SideChaptersResponse.ChapterItem> chapterItemList = new ArrayList<>();

        for (Chapter c : chapterList) {
            UserChapterProgress p = progressMap.get(c.getChapterId());

            ChapterStatus status = calculateStatus(p, prevCompleted);

            SideChaptersResponse.Progress progressDto = null;
            if (p != null && status != ChapterStatus.LOCKED) {
                progressDto = new SideChaptersResponse.Progress(
                        p.isCompleted(),
                        p.getCompletedAt(),
                        p.getRecentUpdatedAt()
                );
            }

            chapterItemList .add(new SideChaptersResponse.ChapterItem(
                    c.getChapterId(),
                    c.getChapterType(),
                    c.getBaseChapterNo(),
                    c.getChapterTitle(),
                    c.getChapterSummary(),
                    status,
                    progressDto
            ));

            prevCompleted = (status == ChapterStatus.COMPLETED);
        }

        return new SideChaptersResponse(userInvestmentType, requestedType, chapterItemList );
    }
}
