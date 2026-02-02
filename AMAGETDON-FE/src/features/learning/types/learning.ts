export type ChapterType = 'NORMAL' | 'AGGRESSIVE' | 'NEUTRAL' | 'STABLE';
export type ChapterStatus = 'COMPLETED' | 'AVAILABLE' | 'LOCKED';

export interface ChapterProgress {
    isCompleted: boolean;
    completedAt: string | null;
    recentUpdatedAt: string | null;
}

export interface ChapterItem {
    chapterId: number;
    chapterType: ChapterType;
    baseChapterNo: number;
    chapterTitle: string;
    chapterSummary: string;
    status: ChapterStatus;
    progress: ChapterProgress | null;
}

export interface BaseChaptersResponse {
    chapters: ChapterItem[];
}

export interface SideChaptersResponse {
    userInvestmentType: string;
    requestedType: ChapterType;
    chapters: ChapterItem[];
}

export interface TypeSummary {
    total: number;
    completed: number;
}

export interface ProgressSummary {
    totalChapters: number;
    completedChapters: number;
    byType: Record<ChapterType, TypeSummary>;
}

export interface ProgressItem {
    chapterId: number;
    chapterType: ChapterType;
    baseChapterNo: number;
    isCompleted: boolean;
    completedAt: string | null;
    recentUpdatedAt: string | null;
}

export interface ProgressResponse {
    summary: ProgressSummary;
    progresses: ProgressItem[];
}

/** GET /chapters/{chapterId} 응답 */
export interface ChapterDetailResponse {
    chapterId: number;
    chapterType: ChapterType;
    baseChapterNo: number;
    chapterTitle: string;
    chapterSummary: string;
    chapterContent: string;
    createdAt: string;
    updatedAt: string;
}
