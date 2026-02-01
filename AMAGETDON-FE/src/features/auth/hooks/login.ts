// src/features/auth/hooks/useLogin.ts
import { useState } from 'react'
import { loginApi } from '../api/authApi'
import type {LoginRequest} from "@/features/auth/types/auth.types.ts";
import {AxiosError} from "axios";


export const useLogin = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const login = async (data: LoginRequest) => {
        try {
            setLoading(true)
            setError(null)

            await loginApi(data)

        } catch (e: unknown) {
            if (e instanceof AxiosError) {
                setError(
                    e.response?.data?.message ??
                    '로그인에 실패했습니다. 이메일 또는 비밀번호를 확인해주세요.'
                )
            } else {
                setError('알 수 없는 오류가 발생했습니다.')
            }

            throw e
        } finally {
            setLoading(false)
        }
    }

    return { login, loading, error }
}
