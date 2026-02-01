package com.amagetdon.learning.service;

import com.amagetdon.common.ErrorCode;
import com.amagetdon.learning.dto.chapter.BaseChaptersResponse;
import com.amagetdon.learning.dto.chapter.ChapterDetailResponse;
import com.amagetdon.learning.dto.chapter.SideChaptersResponse;
import com.amagetdon.learning.dto.quiz.ChapterQuizzesResponse;
import com.amagetdon.learning.entity.*;
import com.amagetdon.learning.repository.ChapterRepository;
import com.amagetdon.learning.repository.QuizChoiceRepository;
import com.amagetdon.learning.repository.QuizRepository;
import com.amagetdon.learning.repository.UserChapterProgressRepository;
import com.amagetdon.user.entity.InvestmentType;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChapterService {

    private final ChapterRepository chapterRepository;
    private final UserChapterProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final QuizChoiceRepository quizChoiceRepository;

    private static final int OX_QUIZ_COUNT = 4;
    private static final int MCQ_QUIZ_COUNT = 6;
    private static final int TOTAL_QUIZ_COUNT = 10;
    private static final int PASS_THRESHOLD = 6;
    private static final int NORMAL_REWARD = 300_000;
    private static final int SIDE_REWARD = 100_000;

    public BaseChaptersResponse getBaseChapters(Long userId) {

        List<Chapter> chapterList = chapterRepository.findAllByChapterTypeOrderByBaseChapterNoAsc(ChapterType.NORMAL);
        Map<Long, UserChapterProgress> progressMap = getProgressMap(userId);

        boolean prevCompleted = true;
        List<BaseChaptersResponse.ChapterItem> chapterItemList = new ArrayList<>();

        for (Chapter c : chapterList) {
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
            prevCompleted = (status == ChapterStatus.COMPLETED);
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
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.CHAPTER_NOT_FOUND.getMessage()));

        // LOCKED 여부 판별
        ChapterStatus status = resolveChapterStatus(userId, chapter);
        if (status == ChapterStatus.LOCKED) {
            throw new org.springframework.security.access.AccessDeniedException(ErrorCode.CHAPTER_LOCKED.getMessage());
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

        // 유저 조회, 사용자 투자 성향 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.USER_NOT_FOUND_SIMPLE.getMessage()));
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

            chapterItemList.add(new SideChaptersResponse.ChapterItem(
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

        return new SideChaptersResponse(userInvestmentType, requestedType, chapterItemList);
    }

    public ChapterQuizzesResponse getChapterQuizzes(Long userId, Long chapterId) {

        // 1. 챕터 존재 여부 확인
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("챕터를 찾을 수 없습니다."));

        // 2. LOCKED 여부 판별
        ChapterStatus status = resolveChapterStatus(userId, chapter);
        if (status == ChapterStatus.LOCKED) {
            throw new SecurityException("잠긴 챕터의 퀴즈는 조회할 수 없습니다.");
        }

        // 3. 챕터의 퀴즈 개수 확인
        long totalQuizCount = quizRepository.countByChapterId(chapterId);
        if (totalQuizCount < TOTAL_QUIZ_COUNT) {
            throw new IllegalStateException("챕터에 충분한 퀴즈가 없습니다.");
        }

        // 4. OX 퀴즈 4문제 랜덤 조회
        List<Quiz> oxQuizzes = quizRepository.findRandomQuizzesByChapterAndType(
                chapterId,
                QuizType.OX.name(),
                OX_QUIZ_COUNT
        );

        // 5. 객관식 퀴즈 6문제 랜덤 조회
        List<Quiz> mcqQuizzes = quizRepository.findRandomQuizzesByChapterAndType(
                chapterId,
                QuizType.MCQ.name(),
                MCQ_QUIZ_COUNT
        );

        // 6. 전체 퀴즈 리스트 합치기
        List<Quiz> allQuizzes = new ArrayList<>();
        allQuizzes.addAll(oxQuizzes);
        allQuizzes.addAll(mcqQuizzes);

        // 7. 퀴즈 개수 검증
        if (allQuizzes.size() != TOTAL_QUIZ_COUNT) {
            throw new IllegalStateException(
                    String.format("퀴즈 개수가 부족합니다. (OX: %d, 객관식: %d)",
                            oxQuizzes.size(), mcqQuizzes.size())
            );
        }

        // 8. 객관식 퀴즈의 선택지 조회 (N+1 방지)
        List<Long> mcqQuizIds = mcqQuizzes.stream()
                .map(Quiz::getQuizId)
                .collect(Collectors.toList());

        List<QuizChoice> allChoices = quizChoiceRepository.findByQuizIdIn(mcqQuizIds);

        // 퀴즈 ID별로 선택지 그룹핑
        Map<Long, List<QuizChoice>> choicesByQuizId = allChoices.stream()
                .collect(Collectors.groupingBy(choice -> choice.getQuiz().getQuizId()));

        // 9. DTO 변환
        List<ChapterQuizzesResponse.QuizItem> quizItems = allQuizzes.stream()
                .map(quiz -> convertToQuizItem(quiz, choicesByQuizId))
                .collect(Collectors.toList());

        // 10. 보상 금액 계산 (일반 커리큘럼 300,000원, 성향별 100,000원)
        int rewardAmount = (chapter.getChapterType() == ChapterType.NORMAL)
                ? NORMAL_REWARD
                : SIDE_REWARD;

        return new ChapterQuizzesResponse(
                chapter.getChapterId(),
                chapter.getChapterTitle(),
                chapter.getChapterType(),
                PASS_THRESHOLD,
                rewardAmount,
                quizItems
        );
    }

    private ChapterQuizzesResponse.QuizItem convertToQuizItem(
            Quiz quiz,
            Map<Long, List<QuizChoice>> choicesByQuizId
    ) {
        List<ChapterQuizzesResponse.ChoiceInfo> choices = null;

        if (quiz.getQuizType() == QuizType.MCQ) {
            List<QuizChoice> quizChoices = choicesByQuizId.getOrDefault(
                    quiz.getQuizId(),
                    Collections.emptyList()
            );

            choices = quizChoices.stream()
                    .map(choice -> new ChapterQuizzesResponse.ChoiceInfo(
                            choice.getChoiceId(),
                            choice.getChoiceText(),
                            choice.getChoiceNo()
                    ))
                    .collect(Collectors.toList());
        }

        return new ChapterQuizzesResponse.QuizItem(
                quiz.getQuizId(),
                quiz.getQuizType(),
                quiz.getQuizContent(),
                choices
        );
    }
}
