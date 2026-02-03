// 백엔드 Survey 엔티티와 일치
export interface SurveyQuestion {
    questionId: number
    questionText: string
}

export interface SurveyAnswer {
    value: number
    label: string
}

// 백엔드 InvestmentType enum과 일치
export type InvestmentType = 'AGGRESSIVE' | 'NEUTRAL' | 'STABLE'

export interface InvestmentResult {
    type: InvestmentType
    label: string
    description: string
}
