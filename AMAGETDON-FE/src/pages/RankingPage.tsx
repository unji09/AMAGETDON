/**
 * RankingPage - 랭킹 페이지
 * S14P11A207-188
 *
 * 파일 위치: src/pages/RankingPage.tsx
 */

import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import RankingList from '@/features/ranking/components/RankingList';
import type { RankingType } from '@/features/ranking/types/rankingTypes';
import { getMyLearningRanking, getMyProfitRanking } from '@/api/rankingApi';
import './RankingPage.css';

interface MyRankingBanner {
    rank: number;
    nickname: string;
    score: number;
}

export const RankingPage = () => {
    const [activeTab, setActiveTab] = useState<RankingType>('learning');
    const [myRanking, setMyRanking] = useState<MyRankingBanner | null>(null);
    const [loadingMyRank, setLoadingMyRank] = useState(false);

    // 내 랭킹 조회
    useEffect(() => {
        const fetchMyRanking = async () => {
            setLoadingMyRank(true);
            try {
                if (activeTab === 'learning') {
                    const data = await getMyLearningRanking();
                    if (data) {
                        setMyRanking({
                            rank: data.rank,
                            nickname: data.nickname,
                            score: data.totalCorrect,
                        });
                    } else {
                        setMyRanking(null);
                    }
                } else {
                    const data = await getMyProfitRanking();
                    if (data) {
                        setMyRanking({
                            rank: data.rank,
                            nickname: data.nickname,
                            score: data.totalProfit,
                        });
                    } else {
                        setMyRanking(null);
                    }
                }
            } catch (err) {
                console.log('내 랭킹 조회 실패 (로그인 필요):', err);
                setMyRanking(null);
            } finally {
                setLoadingMyRank(false);
            }
        };

        fetchMyRanking();
    }, [activeTab]);

    // 점수 포맷팅
    const formatScore = (score: number) => {
        if (activeTab === 'learning') {
            return `${score.toLocaleString()} P`;
        } else {
            const prefix = score >= 0 ? '+' : '';
            return `${prefix}${score.toLocaleString()}원`;
        }
    };

    // 점수 색상 클래스
    const getScoreClass = () => {
        if (activeTab === 'learning') {
            return 'score-learning';
        }
        return myRanking && myRanking.score >= 0 ? 'score-positive' : 'score-negative';
    };

    return (
        <Layout>
            <div className="ranking-page">
                {/* 페이지 헤더 */}
                <div className="ranking-page-header">
                    <h1 className="ranking-page-title">랭킹</h1>
                    <p className="ranking-page-desc">학습과 투자 실력을 겨뤄보세요!</p>
                </div>

                {/* 탭 네비게이션 */}
                <div className="ranking-tabs">
                    <button
                        className={`ranking-tab ${activeTab === 'learning' ? 'active' : ''}`}
                        onClick={() => setActiveTab('learning')}
                    >
                        학습 랭킹
                    </button>
                    <button
                        className={`ranking-tab ${activeTab === 'profit' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profit')}
                    >
                        수익 랭킹
                    </button>
                </div>

                {/* 내 랭킹 배너 */}
                {!loadingMyRank && myRanking && (
                    <div className="my-ranking-banner">
                        <div className="banner-label">내 랭킹</div>
                        <div className="banner-content">
                            <span className="banner-rank">{myRanking.rank.toLocaleString()}위</span>
                            <span className="banner-nickname">{myRanking.nickname}</span>
                            <span className="banner-badge">ME</span>
                            <span className={`banner-score ${getScoreClass()}`}>
                                {formatScore(myRanking.score)}
                            </span>
                        </div>
                    </div>
                )}

                {/* 랭킹 리스트 */}
                <div className="ranking-page-content">
                    <RankingList type={activeTab} />
                </div>
            </div>
        </Layout>
    );
};

export default RankingPage;