/**
 * 스페이싱 시스템 (4px 기준)
 */

export const SPACING = {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
} as const;

export type SpacingKey = keyof typeof SPACING;

// 헬퍼 함수
export const getSpacing = (key: SpacingKey): string => SPACING[key];