import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {getMyInfo} from '@/api/userApi';
import {getMyAchievements} from '@/api/achievementApi';
import {getBaseChapters, getProgress} from '@/api/learningApi';
import {getTodayQuizCount, fetchReviewNotes} from '@/api/quizApi';
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
    const [reviewNoteCount, setReviewNoteCount] = useState(0);

    // 1단계: 필수 데이터 로드
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login', {replace: true} as any);
            return;
        }

        Promise.all([
            getMyInfo(),
            getMyAchievements('ALL'),
            getProgress(),
            getBaseChapters(),
            fetchReviewNotes(),
        ])
            .then(([userRes, achievementRes, progressRes, chaptersRes, reviewNotesRes]) => {
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

                setReviewNoteCount(reviewNotesRes.totalCount);
            })
            .catch(() => {
                navigate('/login', {replace: true} as any);
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    // 2단계: 로딩 완료 후 퀴즈 개수 조회 및 애니메이션
    useEffect(() => {
        if (loading) return;

        getTodayQuizCount()
            .then((res) => {
                const target = res.count;
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
            .catch(() => {
                setQuizStreak(0);
            });
    }, [loading]);

    const navigateToQuiz = () => {
        navigate('/learning/quiz');
    };

    const navigateToDailyQuiz = () => navigate('/daily-quiz');

    const navigateToMyInfo = () => navigate('/mypage');

    const navigateToRanking = () => navigate('/ranking');

    const navigateToAchievement = () => navigate('/achievement');

    const navigateToLearning = () => navigate('/learning');

    const navigateToReviewNote = () => navigate('/learning/review-note');

    return {
        loading,
        userData,
        achievements,
        progressData,
        quizStreak,
        reviewNoteCount,
        navigateToQuiz,
        navigateToDailyQuiz,
        navigateToMyInfo,
        navigateToRanking,
        navigateToAchievement,
        navigateToLearning,
        navigateToReviewNote,
    };
};