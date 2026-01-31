export const COLORS = {
    // 메인 색상
    mainGreen: '#203C2E',
    darkGray: '#282828',
    brown: '#96773D',
    paleGreen: '#C7D8B7',
    beige: '#E3D9BD',
    paleYellow: '#FBF7BE',

    // 차트 색상
    chartUp: '#DC0000',      // 상승 (빨강)
    chartDown: '#0046B4',    // 하락 (파랑)

    // 퀴즈/강조 색상
    quizYellow: '#FADB13',

    // 기본 색상
    white: '#FFFFFF',
    black: '#000000',
    background: '#F5F5F5',
} as const;

export type ColorKey = keyof typeof COLORS;