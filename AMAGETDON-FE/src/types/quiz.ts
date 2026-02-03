/**
 * 퀴즈 타입 정의
 * QuizService.java 및 BE DTO 기준
 */

// 퀴즈 유형
export type QuizType = 'OX' | 'MCQ';

// 선택지 정보
export interface QuizChoiceInfo {
    choiceId: number;
    choiceText: string;
    choiceNo: number;
}

// 퀴즈 상세 정보
export interface QuizDetail {
    quizId: number;
    quizType: QuizType;
    quizContent: string;
    choices: QuizChoiceInfo[] | null; // OX일 경우 null
}

// 무한 퀴즈 응답 (GET /api/v1/quiz/continuous/next)
export interface QuizResponse {
    quizSequence: number;
    isQuizRewardReceived: boolean;
    quizDetail: QuizDetail;
}

// 무한 퀴즈 제출 요청 (POST /api/v1/quiz/continuous/submit)
export interface QuizSubmitRequest {
    quizId: number;
    oxAnswer?: boolean; // OX 퀴즈일 경우
    choiceId?: number;  // MCQ일 경우
}

// 무한 퀴즈 제출 응답
export interface QuizSubmitResponse {
    isCorrect: boolean;
    correctAnswer: string;
    rewardAmount: number;
    addedToReviewNote: boolean;
    currentBalance: number;
}

// 챕터 퀴즈 응답 (GET /api/v1/quiz/chapter/{chapterId})
export interface ChapterQuizResponse {
    chapterId: number;
    quizzes: QuizDetail[];
}

// 챕터 퀴즈 제출 요청 (POST /api/v1/quiz/chapter/result)
export interface ChapterQuizSubmitRequest {
    // chapterId는 URL 파라미터로 전달되므로 제거
    answers: {
        quizId: number;
        oxAnswer?: boolean;
        choiceId?: number;
    }[];
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

// 오답노트 아이템
export interface ReviewNoteItem {
    reviewNoteId: number;
    quizId: number;
    quizType: QuizType;
    quizContent: string;
    choices: QuizChoiceInfo[] | null;
    addedAt: string; // ISO DateTime
    chapterId?: number;
}

// 오답노트 목록 응답
export interface ReviewNoteListResponse {
    totalCount: number;
    reviewNotes: ReviewNoteItem[];
}