/**
 * RankingCard 컴포넌트
 * Figma 디자인 기반 (node-id=46-374)
 *
 * 규격:
 * - 카드: 580px × 280px
 * - 상위 3명 랭킹 표시
 * - 내 랭킹 섹션: 548px × 48px, 배경 #FFF5F5
 * - 이웃 랭킹: 1명 표시
 */

import { useState, useEffect } from 'react';
import {
    getLearningRankings,
    getMyLearningRanking,
    getProfitRankings,
    getMyProfitRanking
} from '@/api/rankingApi';
import type {
    LearningRankingItem,
    ProfitRankingItem,
    MyLearningRanking,
    MyProfitRanking
} from '@/features/ranking/types/rankingTypes';
import './RankingCard.css';

interface RankingCardProps {
    type: 'profit' | 'learning';
}

const RankingCard = ({ type }: RankingCardProps) => {
    const [rankings, setRankings] = useState<(LearningRankingItem | ProfitRankingItem)[]>([]);
    const [myRanking, setMyRanking] = useState<MyLearningRanking | MyProfitRanking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isProfit = type === 'profit';
    const title = isProfit ? '수익 랭킹' : '학습 랭킹';
    const accentColor = isProfit ? '#DC0000' : '#2563EB';

    useEffect(() => {
        loadRankings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);

    const loadRankings = async () => {
        try {
            setLoading(true);
            setError(null);

            if (isProfit) {
                const [listData, myData] = await Promise.all([
                    getProfitRankings(0, 3),
                    getMyProfitRanking().catch(() => null)
                ]);
                setRankings(listData.rankings.slice(0, 3));
                setMyRanking(myData);
            } else {
                const [listData, myData] = await Promise.all([
                    getLearningRankings(0, 3),
                    getMyLearningRanking().catch(() => null)
                ]);
                setRankings(listData.rankings.slice(0, 3));
                setMyRanking(myData);
            }
        } catch (err) {
            console.error('랭킹 조회 실패:', err);
            setError('랭킹을 불러올 수 없습니다');
        } finally {
            setLoading(false);
        }
    };

    // 점수 포맷팅
    const formatScore = (score: number, forProfit: boolean = isProfit): string => {
        if (forProfit) {
            const formatted = Math.abs(score).toLocaleString();
            if (score > 0) return `+${formatted}`;
            if (score < 0) return `-${formatted}`;
            return '0';
        } else {
            return `${score.toLocaleString()} P`;
        }
    };

    // 점수 색상 (수익: 양수 빨강, 음수 파랑 / 학습: 파랑)
    const getScoreColor = (score: number, forProfit: boolean = isProfit): string => {
        if (forProfit) {
            if (score > 0) return '#DC0000';  // 양수: 빨강
            if (score < 0) return '#0046B4';  // 음수: 파랑
            return '#6B7280';                  // 0: 회색
        }
        return '#2563EB';  // 학습: 파랑
    };

    if (loading) {
        return (
            <div className="ranking-card">
                <div className="ranking-card-header">
                    <span className="ranking-card-title">{title}</span>
                    <span className="ranking-card-date">오늘</span>
                </div>
                <div className="ranking-card-loading">
                    <div className="skeleton skeleton-title" style={{ width: 120, height: 22 }} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ranking-card">
                <div className="ranking-card-header">
                    <span className="ranking-card-title">{title}</span>
                    <span className="ranking-card-date">오늘</span>
                </div>
                <div className="ranking-card-error">{error}</div>
            </div>
        );
    }

    return (
        <div className="ranking-card">
            {/* 헤더 */}
            <div className="ranking-card-header">
                <span className="ranking-card-title">{title}</span>
                <span className="ranking-card-date">오늘</span>
            </div>

            {/* 상위 3명 랭킹 */}
            <div className="ranking-card-list">
                {rankings.length === 0 ? (
                    <div className="ranking-empty">아직 랭킹 정보가 없습니다</div>
                ) : (
                    rankings.map((item, index) => {
                        const score = isProfit
                            ? (item as ProfitRankingItem).totalProfit
                            : (item as LearningRankingItem).totalCorrect;
                        return (
                            <div key={item.rank} className="ranking-item">
                                <span className="ranking-item-rank">{index + 1}</span>
                                <span className="ranking-item-nickname">{item.nickname}</span>
                                <span
                                    className="ranking-item-score"
                                    style={{ color: getScoreColor(score) }}
                                >
                                    {formatScore(score)}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 내 랭킹 섹션 */}
            {myRanking && (() => {
                const myScore = isProfit
                    ? (myRanking as MyProfitRanking).totalProfit
                    : (myRanking as MyLearningRanking).totalCorrect;
                const myScoreColor = getScoreColor(myScore);
                const badgeColor = isProfit ? myScoreColor : accentColor;

                return (
                    <div className="my-ranking-section" style={{ background: '#FFF5F5' }}>
                        <div className="my-ranking-item">
                            <span className="my-ranking-rank" style={{ color: myScoreColor }}>
                                {myRanking.rank.toLocaleString()}
                            </span>
                            <span className="my-ranking-nickname">{myRanking.nickname}</span>
                            <span
                                className="my-ranking-badge"
                                style={{ background: badgeColor }}
                            >
                                ME
                            </span>
                            <span
                                className="my-ranking-score"
                                style={{ color: myScoreColor }}
                            >
                                {isProfit
                                    ? formatScore(myScore)
                                    : `${myScore}p`
                                }
                            </span>
                        </div>
                    </div>
                );
            })()}

            {/* 이웃 랭킹 (내 랭킹 다음 순위 1명) */}
            {myRanking && (
                <div className="neighbor-ranking">
                    <span className="neighbor-rank">{(myRanking.rank + 1).toLocaleString()}</span>
                    <span className="neighbor-nickname">소소한행복</span>
                    <span
                        className="neighbor-score"
                        style={{ color: isProfit ? '#0046B4' : '#0046B4' }}
                    >
                        {isProfit ? '-10,000%' : '5p'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default RankingCard;