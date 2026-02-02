import { useEffect, useState, useCallback } from 'react'
import { getMyInfo, type UserInfo } from '../api/userApi'

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

    const clearUser = useCallback(() => {
        localStorage.removeItem('accessToken')
        setUser(null)
    }, [])

    useEffect(() => {
        fetchUser()
    }, [fetchUser])

    return { user, loading, refetch: fetchUser, clearUser, isAuthenticated: !!user }
}
