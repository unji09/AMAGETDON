import apiClient from '@/api/client.ts'
import type { SurveyQuestion, InvestmentType } from '../features/survey/types'

export interface SubmitSurveyRequest {
    score: number
}

// GET /surveys → Survey[] 배열 직접 반환
export const getSurveys = () =>
    apiClient.get<SurveyQuestion[]>('/surveys')

// PUT /surveys → InvestmentType 문자열 반환
export const submitSurvey = (data: SubmitSurveyRequest) =>
    apiClient.put<InvestmentType>('/surveys', data)
