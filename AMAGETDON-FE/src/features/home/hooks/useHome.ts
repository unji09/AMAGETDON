import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyInfo, type UserInfo } from '@/api/userApi'
import { getMyAchievements } from '@/api/achievementApi'
import type { AchievementItem } from '@/features/achievement/types/achievement'

export interface HomeUserData {
    nickname: string
    currentTitle: string | null
    balance: number
}

export const useHome = () => {
    const navigate = useNavigate()
    const [userData, setUserData] = useState<HomeUserData | null>(null)
    const [achievements, setAchievements] = useState<AchievementItem[]>([])
    const [loading, setLoading] = useState(true)
    const [quizStreak, setQuizStreak] = useState(0)

    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        if (!token) {
            navigate('/login', { replace: true })
            return
        }

        Promise.all([
            getMyInfo(),
            getMyAchievements('ALL'),
        ])
            .then(([userRes, achievementRes]) => {
                const data: UserInfo = userRes.data
                setUserData({
                    nickname: data.nickname,
                    currentTitle: data.currentTitle,
                    balance: data.balance,
                })
                setAchievements(achievementRes.achievements)
            })
            .catch(() => {
                navigate('/login', { replace: true })
            })
            .finally(() => setLoading(false))
    }, [navigate])

    // Animate quiz streak counter
    useEffect(() => {
        if (loading) return

        let current = 0
        const target = 86
        const increment = target / 50
        const timer = setInterval(() => {
            current += increment
            if (current >= target) {
                setQuizStreak(target)
                clearInterval(timer)
            } else {
                setQuizStreak(Math.floor(current))
            }
        }, 20)

        return () => clearInterval(timer)
    }, [loading])

    const navigateToMyInfo = () => navigate('/mypage')
    const navigateToRanking = () => navigate('/ranking')
    const navigateToAchievement = () => navigate('/achievement')

    return {
        userData,
        achievements,
        loading,
        quizStreak,
        navigateToMyInfo,
        navigateToRanking,
        navigateToAchievement,
    }
}
