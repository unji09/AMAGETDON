import { useEffect, useState, useCallback } from 'react'
import { getMyInfo, type UserInfo } from '../../../api/userApi.ts'
import { logoutApi } from '@/api/authApi.ts'

export const useAuthUser = () => {
    const [user, setUser] = useState<UserInfo | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('accessToken')
        if (!token) {
            setUser(null)
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const res = await getMyInfo()
            setUser(res.data)
        } catch {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }, [])

    const clearUser = useCallback(async () => {
        localStorage.removeItem('accessToken')
        setUser(null)
        try {
            await logoutApi()
        } catch {
            // 로그아웃 API 실패해도 무시
        }
    }, [])

    useEffect(() => {
        fetchUser()
    }, [fetchUser])

    return { user, loading, refetch: fetchUser, clearUser, isAuthenticated: !!user }
}
