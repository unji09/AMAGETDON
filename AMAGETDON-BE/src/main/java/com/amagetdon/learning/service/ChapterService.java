package com.amagetdon.learning.service;

import com.amagetdon.common.ErrorCode;
import com.amagetdon.learning.dto.chapter.BaseChaptersResponse;
import com.amagetdon.learning.dto.chapter.ChapterDetailResponse;
import com.amagetdon.learning.dto.chapter.SideChaptersResponse;
import com.amagetdon.learning.dto.chapter.*;
import com.amagetdon.learning.dto.quiz.ChapterQuizzesResponse;
import com.amagetdon.learning.entity.*;
import com.amagetdon.learning.repository.*;
import com.amagetdon.user.entity.InvestmentType;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static com.amagetdon.common.ErrorCode.CHAPTER_NOT_FOUND;
import static com.amagetdon.common.ErrorCode.USER_NOT_FOUND_SIMPLE;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChapterService {

    private final ChapterRepository chapterRepository;
    private final UserChapterProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final QuizChoiceRepository quizChoiceRepository;
    private final ReviewNoteRepository reviewNoteRepository;

    private static final int OX_QUIZ_COUNT = 4;
    private static final int MCQ_QUIZ_COUNT = 6;
    private static final int TOTAL_QUIZ_COUNT = 10;
    private static final int PASS_THRESHOLD = 6;
    private static final int NORMAL_REWARD = 300_000;
    private static final int SIDE_REWARD = 100_000;
    private static final String ANSWER_O = "O";

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
        Map<Long, UserChapterProgress> progressMap = getProgressMap(userId);

        if (chapter.getChapterType() == ChapterType.NORMAL) {
            List<Chapter> normalChapters = chapterRepository.findAllByChapterTypeOrderByBaseChapterNoAsc(ChapterType.NORMAL);
            return calculateStatusInSequence(normalChapters, progressMap, chapter.getChapterId());
        }

        // 사이드 챕터: NORMAL 챕터의 baseChapterNo 상태 기반
        List<Chapter> normalChapters = chapterRepository.findAllByChapterTypeOrderByBaseChapterNoAsc(ChapterType.NORMAL);
        Map<Integer, ChapterStatus> normalStatusByBaseNo = new HashMap<>();
        boolean prevNormalCompleted = true;
        for (Chapter nc : normalChapters) {
            UserChapterProgress np = progressMap.get(nc.getChapterId());
            ChapterStatus ns = calculateStatus(np, prevNormalCompleted);
            normalStatusByBaseNo.put(nc.getBaseChapterNo(), ns);
            prevNormalCompleted = (ns == ChapterStatus.COMPLETED);
        }

        ChapterStatus normalStatus = normalStatusByBaseNo.getOrDefault(
                chapter.getBaseChapterNo(), ChapterStatus.LOCKED);
        boolean baseUnlocked = (normalStatus == ChapterStatus.AVAILABLE || normalStatus == ChapterStatus.COMPLETED);

        UserChapterProgress p = progressMap.get(chapter.getChapterId());
        if (p != null && p.isCompleted()) return ChapterStatus.COMPLETED;
        if (baseUnlocked) return ChapterStatus.AVAILABLE;
        return ChapterStatus.LOCKED;
    }

    // 주어진 리스트를 순차적으로 탐색하며 타겟 챕터의 상태를 계산
    private ChapterStatus calculateStatusInSequence(List<Chapter> chapters, Map<Long, UserChapterProgress> progressMap, Long targetChapterId) {
        boolean prevCompleted = true;

        for (Chapter c : chapters) {
            UserChapterProgress p = progressMap.get(c.getChapterId());
            ChapterStatus s = calculateStatus(p, prevCompleted);

            if (c.getChapterId().equals(targetChapterId)) {
                return s;
            }
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

        // NORMAL 챕터 상태 맵 구성 (baseChapterNo → status)
        List<Chapter> normalChapters = chapterRepository.findAllByChapterTypeOrderByBaseChapterNoAsc(ChapterType.NORMAL);
        Map<Long, UserChapterProgress> progressMap = getProgressMap(userId);
        Map<Integer, ChapterStatus> normalStatusByBaseNo = new HashMap<>();
        boolean prevNormalCompleted = true;
        for (Chapter nc : normalChapters) {
            UserChapterProgress np = progressMap.get(nc.getChapterId());
            ChapterStatus ns = calculateStatus(np, prevNormalCompleted);
            normalStatusByBaseNo.put(nc.getBaseChapterNo(), ns);
            prevNormalCompleted = (ns == ChapterStatus.COMPLETED);
        }

        // 해당 타입의 사이드 챕터 조회
        List<Chapter> chapterList = chapterRepository.findAllByChapterTypeOrderByChapterIdAsc(requestedType);

        List<SideChaptersResponse.ChapterItem> chapterItemList = new ArrayList<>();

        for (Chapter c : chapterList) {
            UserChapterProgress p = progressMap.get(c.getChapterId());

            // 사이드 챕터는 대응하는 NORMAL 챕터가 AVAILABLE 이상일 때만 열림
            ChapterStatus normalStatus = normalStatusByBaseNo.getOrDefault(
                    c.getBaseChapterNo(), ChapterStatus.LOCKED);
            boolean baseUnlocked = (normalStatus == ChapterStatus.AVAILABLE || normalStatus == ChapterStatus.COMPLETED);

            ChapterStatus status;
            if (p != null && p.isCompleted()) {
                status = ChapterStatus.COMPLETED;
            } else if (baseUnlocked) {
                status = ChapterStatus.AVAILABLE;
            } else {
                status = ChapterStatus.LOCKED;
            }

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

        // 퀴즈 개수에 따른 동적 백분율 계산 (반올림 처리)
        int totalCount = quizItems.size();
        int passingPercentage = (totalCount > 0)
                ? (int) Math.round(((double) PASS_THRESHOLD / totalCount) * 100)
                : 0;

        return new ChapterQuizzesResponse(
                chapter.getChapterId(),
                chapter.getChapterTitle(),
                chapter.getChapterType(),
                passingPercentage, // % 표시를 위해 단위 변경
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

    @Transactional
    public QuizSubmissionResponse submitQuizAnswers(Long userId, Long chapterId, QuizSubmissionRequest request) {
        // 1. 기초 데이터 로드
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(USER_NOT_FOUND_SIMPLE.getMessage()));
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException(CHAPTER_NOT_FOUND.getMessage()));

        // 2. 퀴즈 데이터 일괄 조회 (N+1 방지)
        List<Long> quizIds = request.answers().stream().map(QuizSubmissionRequest.AnswerItem::quizId).toList();
        Map<Long, Quiz> quizMap = quizRepository.findAllById(quizIds).stream()
                .collect(Collectors.toMap(Quiz::getQuizId, q -> q));

        // 3. MCQ 선택지 데이터 일괄 조회 (숫자로 들어온 답변들)
        List<Long> choiceIds = request.answers().stream()
                .filter(a -> isNumeric(a.answer()))
                .map(a -> Long.parseLong(a.answer()))
                .toList();
        Map<Long, QuizChoice> choiceMap = quizChoiceRepository.findAllById(choiceIds).stream()
                .collect(Collectors.toMap(QuizChoice::getChoiceId, c -> c));

        // 4. 채점 시작
        int correctCount = 0;
        List<Long> wrongQuizIds = new ArrayList<>();

        for (QuizSubmissionRequest.AnswerItem item : request.answers()) {
            Quiz quiz = quizMap.get(item.quizId());
            if (quiz == null) continue;

            boolean isCorrect = false;

            if (quiz.getQuizType() == QuizType.OX) {
                // OX 정답 비교: "O" -> true, "X" -> false
                boolean userAns = item.answer().equalsIgnoreCase(ANSWER_O);
                isCorrect = (quiz.getAnswerOx() == userAns);
            } else if (quiz.getQuizType() == QuizType.MCQ) {
                // MCQ 정답 비교: 선택지의 is_answer 필드 확인
                QuizChoice choice = choiceMap.get(Long.parseLong(item.answer()));
                isCorrect = (choice != null && choice.getIsAnswer());
            }

            if (isCorrect) correctCount++;
            else wrongQuizIds.add(quiz.getQuizId());
        }

        // 5. 결과 계산 (정답률 60% 이상)
        int totalCount = request.answers().size();
        int correctRate = (int) (((double) correctCount / totalCount) * 100);
        boolean isPassed = correctCount >= PASS_THRESHOLD;
        long rewardAmount = 0;
        boolean nextChapterUnlocked = false;

        // 6. 통과 시 보상 및 진도 업데이트
        if (isPassed) {
            rewardAmount = (chapter.getChapterType() == ChapterType.NORMAL) ? NORMAL_REWARD : SIDE_REWARD;
            // 사용자 잔액 추가
            user.addBalance(rewardAmount);

            UserChapterProgress progress = progressRepository.findById(new UserChapterProgress.UserChapterProgressId(chapterId, userId))
                    .orElseGet(() -> UserChapterProgress.create(chapterId, userId));

            if (!progress.isCompleted()) {
                progress.complete(LocalDateTime.now());
                progressRepository.save(progress);
                nextChapterUnlocked = true;
            }
        }

        // 7. 오답 노트 저장 (틀린 문제들)
        if (!wrongQuizIds.isEmpty()) {
            List<ReviewNote> reviewNotes = wrongQuizIds.stream()
                    .map(quizId -> {
                        Quiz quiz = quizMap.get(quizId);
                        return new ReviewNote(userId, quiz);
                    })
                    .toList();

            reviewNoteRepository.saveAll(reviewNotes);
        }

        return QuizSubmissionResponse.builder()
                .success(true)
                .message(isPassed ? String.format("챕터를 완료했습니다! %,d원이 지급되었습니다.", rewardAmount)
                        : String.format("정답률 %d%%입니다. 다시 도전해보세요!", correctRate))
                .data(QuizSubmissionResponse.QuizResultData.builder()
                        .isPassed(isPassed)
                        .correctCount(correctCount)
                        .totalCount(totalCount)
                        .correctRate(correctRate)
                        .rewardAmount(rewardAmount)
                        .wrongQuizCount(wrongQuizIds.size())
                        .currentBalance(user.getBalance())
                        .nextChapterUnlocked(nextChapterUnlocked)
                        .build())
                .build();
    }

    private boolean isNumeric(String str) {
        return str != null && str.matches("-?\\d+(\\.\\d+)?");
    }
}
