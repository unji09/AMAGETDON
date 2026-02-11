import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {getMyInfo} from '@/api/userApi';
import {getMyAchievements} from '@/api/achievementApi';
import {getBaseChapters, getProgress} from '@/api/learningApi';
import {getTodayQuizCount, fetchReviewNotes} from '@/api/quizApi';
import {getMyLearningRanking, getMyProfitRanking, getLearningRankings, getProfitRankings} from '@/api/rankingApi';
import type {AchievementItem} from '@/features/achievement/types/achievement';
import type {MyLearningRanking, MyProfitRanking} from '@/features/ranking/types/rankingTypes';

interface UserInfo {
    nickname: string;
    currentTitle: string | null;
    balance: number;
    investmentType: 'AGGRESSIVE' | 'NEUTRAL' | 'STABLE' | null;
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

interface RankingData {
    learningRank: MyLearningRanking | null;
    profitRank: MyProfitRanking | null;
    totalLearningUsers: number;
    totalProfitUsers: number;
}

export const useHome = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<UserInfo>({
        nickname: '',
        currentTitle: null,
        balance: 0,
        investmentType: null,
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
    const [rankingData, setRankingData] = useState<RankingData>({
        learningRank: null,
        profitRank: null,
        totalLearningUsers: 0,
        totalProfitUsers: 0,
    });

    // 1단계: 필수 데이터 로드
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login', {replace: true} as any);
            return;
        }

        // 필수 데이터 로드
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
                    investmentType: data.investmentType,
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
                // 랭킹 데이터는 별도로 로드 (실패해도 메인 페이지에 영향 없음)
                Promise.allSettled([
                    getMyLearningRanking(),
                    getMyProfitRanking(),
                    getLearningRankings(0, 1),
                    getProfitRankings(0, 1),
                ]).then(([learningRankRes, profitRankRes, learningListRes, profitListRes]) => {
                    setRankingData({
                        learningRank: learningRankRes.status === 'fulfilled' ? learningRankRes.value : null,
                        profitRank: profitRankRes.status === 'fulfilled' ? profitRankRes.value : null,
                        totalLearningUsers: learningListRes.status === 'fulfilled' ? learningListRes.value.totalElements : 0,
                        totalProfitUsers: profitListRes.status === 'fulfilled' ? profitListRes.value.totalElements : 0,
                    });
                });
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
        rankingData,
        navigateToQuiz,
        navigateToDailyQuiz,
        navigateToMyInfo,
        navigateToRanking,
        navigateToAchievement,
        navigateToLearning,
        navigateToReviewNote,
    };
};