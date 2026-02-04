import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {getMyInfo} from '@/api/userApi';
import {getMyAchievements} from '@/api/achievementApi';
import {getBaseChapters, getProgress} from '@/api/learningApi';
import {fetchDailyQuiz} from '@/api/quizApi';
import type {AchievementItem} from '@/features/achievement/types/achievement';

interface UserInfo {
    nickname: string;
    currentTitle: string | null;
    balance: number;
}

interface ProgressData {
    totalChapters: number;
    completedChapters: number;
    percentage: number;
    nextChapter: {
        chapterId: number;
        chapterTitle: string;
        chapterNo: number;
    } | null;
}

export const useHome = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<UserInfo>({
        nickname: '',
        currentTitle: null,
        balance: 0,
    });
    const [achievements, setAchievements] = useState<AchievementItem[]>([]);
    const [progressData, setProgressData] = useState<ProgressData>({
        totalChapters: 0,
        completedChapters: 0,
        percentage: 0,
        nextChapter: null,
    });
    const [quizStreak, setQuizStreak] = useState(0);

    // 1단계: 필수 데이터 로드
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login', {replace: true});
            return;
        }

        Promise.all([
            getMyInfo(),
            getMyAchievements('ALL'),
            getProgress(),
            getBaseChapters(),
        ])
            .then(([userRes, achievementRes, progressRes, chaptersRes]) => {
                const data = userRes.data;
                setUserData({
                    nickname: data.nickname,
                    currentTitle: data.currentTitle,
                    balance: data.balance,
                });
                setAchievements(achievementRes.achievements);

                const {totalChapters, completedChapters} = progressRes.summary;
                const percentage =
                    totalChapters > 0
                        ? Math.round((completedChapters / totalChapters) * 100)
                        : 0;

                const nextChapterItem = chaptersRes.chapters.find(
                    (ch) => ch.status === 'AVAILABLE'
                );
                const nextChapter = nextChapterItem
                    ? {
                        chapterId: nextChapterItem.chapterId,
                        chapterTitle: nextChapterItem.chapterTitle,
                        chapterNo: nextChapterItem.baseChapterNo,
                    }
                    : null;

                setProgressData({
                    totalChapters,
                    completedChapters,
                    percentage,
                    nextChapter,
                });
            })
            .catch(() => {
                navigate('/login', {replace: true});
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    // 2단계: 로딩 완료 후 퀴즈 애니메이션
    useEffect(() => {
        if (loading) return;

        fetchDailyQuiz()
            .then((res) => {
                const target = res.quizSequence || 0;
                let current = 0;
                const increment = target / 50;

                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        setQuizStreak(target);
                        clearInterval(timer);
                    } else {
                        setQuizStreak(Math.floor(current));
                    }
                }, 20);

                return () => clearInterval(timer);
            })
            .catch((error) => {
                // 400 에러 = 더 이상 퀴즈 없음 (100문제 완료)
                if (error.response?.status === 400) {
                    setQuizStreak(100);
                } else {
                    setQuizStreak(0);
                }
            });
    }, [loading]);

    const navigateToQuiz = () => {
        navigate('/learning/quiz');
    };

    const navigateToDailyQuiz = () => {
        navigate('/learning/quiz');
    };

    return {
        loading,
        userData,
        achievements,
        progressData,
        quizStreak,
        navigateToQuiz,
        navigateToDailyQuiz,
    };
};