export type AchievementCategory =
    | 'ATTENDANCE'
    | 'TRADE'
    | 'COMMUNITY'
    | 'ASSET'
    | 'LEARNING'
    | 'INDUSTRY'
    | 'TRADE_TIME'
    | 'RETURN_RATE';

export type AchievementFilter = 'ALL' | 'ACHIEVED' | 'LOCKED';

export interface AchievementItem {
    achievementId: number;
    achievementName: string;
    achievementCategory: AchievementCategory;
    /** 달성 시 아이콘 URL, 미달성 시 null */
    achievementIcon: string | null;
    /** 달성 시 설명 텍스트, 미달성 시 null */
    achievementContent: string | null;
    isAchieved: boolean;
    achievedAt: string | null;
}

export interface AchievementResponse {
    totalCount: number;
    achievedCount: number;
    achievements: AchievementItem[];
}

/** 카테고리 짧은 라벨 (카드 태그용) */
export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
    ATTENDANCE: '출석',
    TRADE: '거래',
    COMMUNITY: '커뮤니티',
    ASSET: '자산',
    LEARNING: '학습',
    INDUSTRY: '산업',
    TRADE_TIME: '거래 시간',
    RETURN_RATE: '수익률',
};

/** 카테고리 섹션 제목 (그리드 그룹 헤더용) */
export const CATEGORY_SECTION_TITLES: Record<AchievementCategory, string> = {
    ATTENDANCE: '꾸준함의 힘',
    TRADE: '실전 투자자',
    COMMUNITY: '함께하는 투자',
    ASSET: '자산의 여정',
    LEARNING: '지식은 무기다',
    INDUSTRY: '산업 전문가',
    TRADE_TIME: '타이밍의 기술',
    RETURN_RATE: '수익률의 전설',
};
