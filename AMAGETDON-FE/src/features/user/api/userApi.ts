import apiClient from "@/api/client.ts";

export type InvestmentType = 'AGGRESSIVE' | 'NEUTRAL' | 'STABLE'

export interface UserInfo {
    userId: number
    email: string
    nickname: string
    investmentType: InvestmentType | null
    currentTitle: string | null
    totalPoints: number
    balance: number
}

export interface UpdateUserRequest {
    email: string
    nickname: string
    password?: string
}

export const getMyInfo = () =>
    apiClient.get<UserInfo>('/users/me')

export const updateMyInfo = (data: UpdateUserRequest) =>
    apiClient.put<UserInfo>('/users/me', data)

export const sendPasswordResetEmail = (email: string) =>
    apiClient.post('/users/password/email', { email })
