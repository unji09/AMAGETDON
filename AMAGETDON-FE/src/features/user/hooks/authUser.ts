import { useEffect, useState } from 'react'
import { getMyInfo } from '../api/userApi'

export interface AuthUser {
    userId: number
    nickname: string
    email: string
}

export const useAuthUser = () => {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchUser = async () => {
        try {
            const res = await getMyInfo()
            setUser(res.data)
        } catch {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUser()
    }, [])

    return { user, loading, refetch: fetchUser }
}
