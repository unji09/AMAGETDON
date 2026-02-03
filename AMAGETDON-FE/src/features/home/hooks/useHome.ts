import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyInfo, type UserInfo } from '@/api/userApi'
import { getMyAchievements } from '@/api/achievementApi'
import { getProgress, getBaseChapters } from '@/api/learningApi'
import type { AchievementItem } from '@/features/achievement/types/achievement'

export interface HomeUserData {
    nickname: string
    currentTitle: string | null
    balance: number
}

export interface ProgressData {
    totalChapters: number
    completedChapters: number
    percentage: number
    nextChapter: {
        chapterId: number
        chapterTitle: string
        chapterNo: number
    } | null
}

export const useHome = () => {
    const navigate = useNavigate()
    const [userData, setUserData] = useState<HomeUserData | null>(null)
    const [achievements, setAchievements] = useState<AchievementItem[]>([])
    const [progressData, setProgressData] = useState<ProgressData | null>(null)
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
            getProgress(),
            getBaseChapters(),
        ])
            .then(([userRes, achievementRes, progressRes, chaptersRes]) => {
                const data: UserInfo = userRes.data
                setUserData({
                    nickname: data.nickname,
                    currentTitle: data.currentTitle,
                    balance: data.balance,
                })
                setAchievements(achievementRes.achievements)

                const { totalChapters, completedChapters } = progressRes.summary
                const percentage = totalChapters > 0
                    ? Math.round((completedChapters / totalChapters) * 100)
                    : 0

                // 다음 학습할 챕터 찾기 (status === 'AVAILABLE'인 첫 번째)
                const nextChapterItem = chaptersRes.chapters.find(
                    (ch) => ch.status === 'AVAILABLE'
                )
                const nextChapter = nextChapterItem
                    ? {
                        chapterId: nextChapterItem.chapterId,
                        chapterTitle: nextChapterItem.chapterTitle,
                        chapterNo: nextChapterItem.baseChapterNo,
                    }
                    : null

                setProgressData({ totalChapters, completedChapters, percentage, nextChapter })
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
    const navigateToDailyQuiz = () => navigate('/daily-quiz')
    const navigateToLearning = () => navigate('/learning')

    return {
        userData,
        achievements,
        progressData,
        loading,
        quizStreak,
        navigateToMyInfo,
        navigateToRanking,
        navigateToAchievement,
        navigateToDailyQuiz,
        navigateToLearning,
    }
}
