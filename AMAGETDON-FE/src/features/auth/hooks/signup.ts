// src/features/auth/hooks/useSignup.ts
import { useState } from 'react'
import { AxiosError } from 'axios'
import { signupApi } from '../api/authApi'
import type {SignupRequest} from "@/features/auth/types/auth.types.ts";


export const useSignup = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const signup = async (data: SignupRequest): Promise<void> => {
        try {
            setLoading(true)
            setError(null)
            await signupApi(data)
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
