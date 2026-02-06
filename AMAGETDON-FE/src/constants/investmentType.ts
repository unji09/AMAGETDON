/**
 * 투자 성향 타입 및 설정
 * - 홈페이지, 헤더, 마이페이지, 설문결과에서 통일하여 사용
 */

export type InvestmentType = 'AGGRESSIVE' | 'NEUTRAL' | 'STABLE';

export interface InvestmentTypeConfig {
    label: string;
    icon: string;
    color: string;
    bgColor: string;
    description: string;
}

export const INVESTMENT_TYPE_CONFIG: Record<InvestmentType, InvestmentTypeConfig> = {
    AGGRESSIVE: {
        label: '공격형',
        icon: '🔥',
        color: '#e53e3e',
        bgColor: '#fed7d7',
        description: '높은 수익을 위해 높은 위험을 감수하는 투자 성향입니다.',
    },
    NEUTRAL: {
        label: '중립형',
        icon: '⚖️',
        color: '#718096',
        bgColor: '#e2e8f0',
        description: '수익과 안정 사이에서 균형을 추구하는 투자 성향입니다.',
    },
    STABLE: {
        label: '안정형',
        icon: '🛡️',
        color: '#3182ce',
        bgColor: '#bee3f8',
        description: '안정적인 수익을 위해 낮은 위험을 선호하는 투자 성향입니다.',
    },
};

/**
 * 투자 성향에 해당하는 아이콘 반환
 */
export const getInvestmentIcon = (type: InvestmentType | null): string => {
    if (!type) return '👤';
    return INVESTMENT_TYPE_CONFIG[type].icon;
};

/**
 * 투자 성향에 해당하는 라벨 반환
 */
export const getInvestmentLabel = (type: InvestmentType | null): string => {
    if (!type) return '-';
    return INVESTMENT_TYPE_CONFIG[type].label;
};
