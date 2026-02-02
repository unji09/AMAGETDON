// src/features/auth/hooks/useSignup.ts
import { useState } from 'react'
import { AxiosError } from 'axios'
import { signupApi } from '../api/authApi'
import type { SignupRequest, AuthLoginResponse } from "@/features/auth/types/auth.types.ts"

export const useSignup = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const signup = async (data: SignupRequest): Promise<AuthLoginResponse> => {
        try {
            setLoading(true)
            setError(null)

            const response = await signupApi(data)
            const authData = response.data

            // 토큰 저장 (자동 로그인)
            if (authData.accessToken) {
                localStorage.setItem('accessToken', authData.accessToken)
            }

            return authData
        } catch (e: unknown) {
            if (e instanceof AxiosError) {
                setError(
                    e.response?.data?.message ??
                    '회원가입에 실패했습니다. 입력값을 다시 확인해주세요.'
                )
            } else {
                setError('알 수 없는 오류가 발생했습니다.')
            }
            throw e
        } finally {
            setLoading(false)
        }
    }

    return { signup, loading, error }
}
