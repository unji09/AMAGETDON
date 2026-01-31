/**
 * 타이포그래피 시스템
 */

export const TYPOGRAPHY = {
    // 폰트 크기
    fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '28px',
        '4xl': '32px',
    },

    // 폰트 굵기
    fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },

    // 줄 간격
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },

    // 폰트 패밀리
    fontFamily: {
        base: "system-ui, -apple-system, 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
        mono: "'Courier New', monospace",
    },
} as const;

export type FontSize = keyof typeof TYPOGRAPHY.fontSize;
export type FontWeight = keyof typeof TYPOGRAPHY.fontWeight;
export type LineHeight = keyof typeof TYPOGRAPHY.lineHeight;