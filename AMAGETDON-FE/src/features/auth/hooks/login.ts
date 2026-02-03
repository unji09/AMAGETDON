// src/features/auth/hooks/useLogin.ts
import { useState } from 'react'
import { loginApi, logoutApi } from '../../../api/authApi.ts'
import type { LoginRequest, AuthLoginResponse } from '@/features/auth/types/auth.types'
import { AxiosError } from 'axios'


export const useLogin = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const login = async (data: LoginRequest): Promise<AuthLoginResponse> => {
        try {
            setLoading(true)
            setError(null)

            const response = await loginApi(data)
            const authData = response.data

            // 토큰 저장
            if (authData.accessToken) {
                localStorage.setItem('accessToken', authData.accessToken)
            }

            return authData

        } catch (e: unknown) {
            if (e instanceof AxiosError) {
                const status = e.response?.status
                const serverMessage = e.response?.data?.message

                let errorMessage: string
                if (status === 401) {
                    errorMessage = serverMessage || '이메일 또는 비밀번호가 올바르지 않습니다.'
                } else if (status === 404) {
                    errorMessage = '존재하지 않는 계정입니다. 이메일을 확인해주세요.'
                } else if (status === 400) {
                    errorMessage = serverMessage || '입력 정보를 확인해주세요.'
                } else if (status === 500) {
                    errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
                } else if (!e.response) {
                    errorMessage = '네트워크 연결을 확인해주세요.'
                } else {
                    errorMessage = serverMessage || '로그인에 실패했습니다.'
                }

                setError(errorMessage)
            } else {
                setError('알 수 없는 오류가 발생했습니다.')
            }

            throw e
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        localStorage.removeItem('accessToken')
        try {
            // 백엔드에 로그아웃 요청 (RefreshToken 쿠키 삭제)
            await logoutApi()
        } catch {
            // 로그아웃 API 실패해도 무시
        }
    }

    return { login, logout, loading, error }
}
