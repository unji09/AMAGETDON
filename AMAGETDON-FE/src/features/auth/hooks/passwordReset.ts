// src/features/auth/hooks/usePasswordReset.ts
import { useState } from 'react'
import { requestPasswordReset } from '../api/passwordApi'

export const usePasswordReset = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const sendResetEmail = async (email: string) => {
        try {
            setLoading(true)
            setError(null)
            await requestPasswordReset(email)
            setSuccess(true)
        } catch (e: any) {
            setError(
                e?.response?.data?.message ??
                '비밀번호 재설정 메일 전송에 실패했습니다.'
            )
            throw e
        } finally {
            setLoading(false)
        }
    }

    return {
        sendResetEmail,
        loading,
        error,
        success,
    }
}
