/**
 * 퀴즈 타입 정의
 * 백엔드 QuizController.java 및 DTO 기준
 */

// 퀴즈 유형
export type QuizType = 'OX' | 'MCQ';

// 선택지 정보 (백엔드: ChoiceInfo)
export interface QuizChoiceInfo {
    choiceId: number;
    choiceText: string;
    choiceOrder: number; // 백엔드는 choiceOrder 사용
}

// 퀴즈 상세 정보 (백엔드: QuizDetail)
export interface QuizDetail {
    quizId: number;
    quizType: QuizType;
    content: string; // 백엔드는 content 사용 (quizContent 아님)
    choices: QuizChoiceInfo[] | null; // OX일 경우 null
}

// 무한 퀴즈 응답 (GET /api/v1/quizzes/daily)
export interface QuizResponse {
    quizSequence: number;
    isQuizRewardReceived: boolean;
    quiz: QuizDetail; // 백엔드는 quiz 사용 (quizDetail 아님)
}

// 무한 퀴즈 제출 요청 (POST /api/v1/quizzes/daily)
export interface QuizSubmitRequest {
    quizId: number;
    answer: string; // 백엔드는 answer(string) 사용
    oxAnswer?: boolean;
    choiceId?: number;
    oxAnswerValue?: boolean;
}

// 무한 퀴즈 제출 응답
export interface QuizSubmitResponse {
    isCorrect: boolean;
    correctAnswer: string;
    rewardAmount: number;
    addedToReviewNote: boolean;
    currentBalance: number;
}

// 챕터 퀴즈 응답 (GET /api/v1/chapters/{chapterId}/quizzes)
export interface ChapterQuizResponse {
    chapterId: number;
    chapterTitle: string;
    chapterType: 'NORMAL' | 'AGGRESSIVE' | 'NEUTRAL' | 'STABLE';
    passThreshold: number;
    rewardAmount: number;
    quizzes: QuizDetail[];
}

// 챕터 퀴즈 답안 아이템
export interface ChapterAnswerItem {
    quizId: number;
    answer: string;
}

// 챕터 퀴즈 제출 요청 (POST /api/v1/chapters/{chapterId}/quizzes)
export interface ChapterQuizSubmitRequest {
    answers: ChapterAnswerItem[];
}

// 챕터 퀴즈 결과 데이터
export interface ChapterQuizResultData {
    isPassed: boolean;
    correctCount: number;
    totalCount: number;
    correctRate: number;
    rewardAmount: number;
    wrongQuizCount: number;
    currentBalance: number;
    nextChapterUnlocked: boolean;
}

// 챕터 퀴즈 제출 응답
export interface ChapterQuizSubmitResponse {
    success: boolean;
    message: string;
    data: ChapterQuizResultData;
}

// 오답노트 아이템 (백엔드: ReviewNoteDetail)
export interface ReviewNoteItem {
    reviewNoteId: number;
    quizId: number;
    quizType: QuizType;
    content: string; // 백엔드는 content 사용
    choices: QuizChoiceInfo[] | null;
    addedAt: string; // ISO DateTime
}
/** 오답노트 상세 */
export interface ReviewNoteDetail {
    reviewNoteId: number;
    quizId: number;
    quizType: QuizType;
    content: string;
    /** 객관식일 경우에만 존재 */
    choices?: QuizChoiceInfo[];
    addedAt: string;
}

/** 오답노트 목록 조회 응답 */
export interface ReviewNoteListResponse {
    /** 오늘 보상 수령 여부 */
    todayRewardReceived: boolean;
    /** 총 오답 개수 */
    totalCount: number;
    /** 챕터별로 그룹화된 오답 목록 (key: 챕터명) */
    reviewNotes: Record<string, ReviewNoteDetail[]>;
}

/** 오답노트 제출 요청 */
export interface ReviewNoteSubmitRequest {
    quizId: number;
    /** OX 문제: "O" 또는 "X", 객관식: 선택지 ID (문자열) */
    answer: string;
}

/** 오답노트 제출 응답 */
export interface ReviewNoteSubmitResponse {
    /** 정답 여부 */
    isCorrect: boolean;
    /** 정답 시 오답노트에서 삭제됨 */
    message: string;
    /** 오늘 첫 풀이 보상 수령 여부 (50,000원) */
    rewardReceived?: boolean;
}

/** 오답노트 개별 삭제 응답 */
export interface ReviewNoteDeleteResponse {
    message: string;
}