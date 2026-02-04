/**
 * 퀴즈 및 오답노트 관련 타입
 */

/** 퀴즈 타입 */
export type QuizType = 'OX' | 'MCQ';

/** 선택지 정보 */
export interface ChoiceInfo {
    choiceId: number;
    choiceText: string;
    choiceOrder: number;
}

/** 오답노트 상세 */
export interface ReviewNoteDetail {
    reviewNoteId: number;
    quizId: number;
    quizType: QuizType;
    content: string;
    /** 객관식일 경우에만 존재 */
    choices?: ChoiceInfo[];
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