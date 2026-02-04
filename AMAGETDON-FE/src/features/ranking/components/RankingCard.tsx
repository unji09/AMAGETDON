/**
 * RankingCard 컴포넌트
 *
 * 구조:
 * 1. TOP 3 고정 표시
 * 2. 4~10위 펼치기/접기 (TOP 3 바로 아래)
 * 3. 내 순위 + 위아래 (맨 아래 고정)
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

interface NeighborRanking {
    rank: number;
    nickname: string;
    score: number;
    userId: number;
}

const RankingCard = ({ type }: RankingCardProps) => {
    const [top3Rankings, setTop3Rankings] = useState<(LearningRankingItem | ProfitRankingItem)[]>([]);
    const [rank4to10, setRank4to10] = useState<(LearningRankingItem | ProfitRankingItem)[]>([]);
    const [myRanking, setMyRanking] = useState<MyLearningRanking | MyProfitRanking | null>(null);
    const [aboveNeighbor, setAboveNeighbor] = useState<NeighborRanking | null>(null);
    const [belowNeighbor, setBelowNeighbor] = useState<NeighborRanking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

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
            setAboveNeighbor(null);
            setBelowNeighbor(null);

            if (isProfit) {
                const [listData, myData] = await Promise.all([
                    getProfitRankings(0, 100),
                    getMyProfitRanking().catch(() => null)
                ]);

                // TOP 3
                setTop3Rankings(listData.rankings.filter(r => r.rank <= 3));
                // 4~10위
                setRank4to10(listData.rankings.filter(r => r.rank >= 4 && r.rank <= 10));
                setMyRanking(myData);

                if (myData) {
                    findNeighbors(listData.rankings, myData.rank, true);
                }
            } else {
                const [listData, myData] = await Promise.all([
                    getLearningRankings(0, 100),
                    getMyLearningRanking().catch(() => null)
                ]);

                setTop3Rankings(listData.rankings.filter(r => r.rank <= 3));
                setRank4to10(listData.rankings.filter(r => r.rank >= 4 && r.rank <= 10));
                setMyRanking(myData);

                if (myData) {
                    findNeighbors(listData.rankings, myData.rank, false);
                }
            }
        } catch (err) {
            console.error('랭킹 조회 실패:', err);
            setError('랭킹을 불러올 수 없습니다');
        } finally {
            setLoading(false);
        }
    };

    const findNeighbors = (
        allRankings: (LearningRankingItem | ProfitRankingItem)[],
        myRank: number,
        forProfit: boolean
    ) => {
        // 내 순위 바로 위
        const above = allRankings.find(r => r.rank === myRank - 1);
        if (above) {
            setAboveNeighbor({
                rank: above.rank,
                nickname: above.nickname,
                userId: above.userId,
                score: forProfit
                    ? (above as ProfitRankingItem).totalProfit
                    : (above as LearningRankingItem).totalCorrect
            });
        }

        // 내 순위 바로 아래
        const below = allRankings.find(r => r.rank === myRank + 1);
        if (below) {
            setBelowNeighbor({
                rank: below.rank,
                nickname: below.nickname,
                userId: below.userId,
                score: forProfit
                    ? (below as ProfitRankingItem).totalProfit
                    : (below as LearningRankingItem).totalCorrect
            });
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
            return `${score.toLocaleString()}P`;
        }
    };

    // 점수 색상
    const getScoreColor = (score: number, forProfit: boolean = isProfit): string => {
        if (forProfit) {
            if (score > 0) return '#DC0000';
            if (score < 0) return '#0046B4';
            return '#6B7280';
        }
        return '#2563EB';
    };

    // 1~2등이면 내 순위 섹션 숨김 (TOP 3에서 위아래가 다 보임)
    // 3등 이하는 항상 내 순위 섹션 표시
    const shouldHideMyRankSection = myRanking && myRanking.rank <= 2;

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

            {/* TOP 3 랭킹 */}
            <div className="ranking-card-top3">
                {top3Rankings.length === 0 ? (
                    <div className="ranking-empty">아직 랭킹 정보가 없습니다</div>
                ) : (
                    top3Rankings.map((item) => {
                        const score = isProfit
                            ? (item as ProfitRankingItem).totalProfit
                            : (item as LearningRankingItem).totalCorrect;
                        const isMe = myRanking && item.userId === myRanking.userId;

                        return (
                            <div
                                key={`${type}-top-${item.userId}`}
                                className={`ranking-item ${isMe ? 'ranking-item--me' : ''}`}
                            >
                                <span className="ranking-item-rank">{item.rank}</span>
                                <span className="ranking-item-nickname">
                                    {item.nickname}
                                    {isMe && <span className="ranking-item-badge" style={{ background: accentColor }}>ME</span>}
                                </span>
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

            {/* 4~10위 펼치기/접기 */}
            {rank4to10.length > 0 && (
                <div className="ranking-expand-section">
                    <button
                        className="ranking-expand-btn"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <span>{isExpanded ? '4~10위 접기' : '4~10위 보기'}</span>
                        <svg
                            className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                        >
                            <path d="M2 4L6 8L10 4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                    </button>

                    {isExpanded && (
                        <div className="ranking-expanded-list">
                            {rank4to10.map((item) => {
                                const score = isProfit
                                    ? (item as ProfitRankingItem).totalProfit
                                    : (item as LearningRankingItem).totalCorrect;
                                const isMe = myRanking && item.userId === myRanking.userId;

                                return (
                                    <div
                                        key={`${type}-exp-${item.userId}`}
                                        className={`ranking-item ranking-item--small ${isMe ? 'ranking-item--me' : ''}`}
                                    >
                                        <span className="ranking-item-rank">{item.rank}</span>
                                        <span className="ranking-item-nickname">
                                            {item.nickname}
                                            {isMe && <span className="ranking-item-badge" style={{ background: accentColor }}>ME</span>}
                                        </span>
                                        <span
                                            className="ranking-item-score"
                                            style={{ color: getScoreColor(score) }}
                                        >
                                            {formatScore(score)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* 내 순위 섹션 (3등 이하일 때 표시) */}
            {myRanking && !shouldHideMyRankSection && (() => {
                const myScore = isProfit
                    ? (myRanking as MyProfitRanking).totalProfit
                    : (myRanking as MyLearningRanking).totalCorrect;
                const myScoreColor = getScoreColor(myScore);

                return (
                    <div className="my-ranking-section">
                        {/* 내 위 순위 */}
                        {aboveNeighbor && (
                            <div className="neighbor-ranking">
                                <span className="neighbor-rank">{aboveNeighbor.rank}</span>
                                <span className="neighbor-nickname">{aboveNeighbor.nickname}</span>
                                <span
                                    className="neighbor-score"
                                    style={{ color: getScoreColor(aboveNeighbor.score) }}
                                >
                                    {formatScore(aboveNeighbor.score)}
                                </span>
                            </div>
                        )}

                        {/* 내 랭킹 */}
                        <div className="my-ranking-item">
                            <span className="my-ranking-rank" style={{ color: myScoreColor }}>
                                {myRanking.rank}
                            </span>
                            <span className="my-ranking-nickname">{myRanking.nickname}</span>
                            <span
                                className="my-ranking-badge"
                                style={{ background: myScoreColor }}
                            >
                                ME
                            </span>
                            <span
                                className="my-ranking-score"
                                style={{ color: myScoreColor }}
                            >
                                {formatScore(myScore)}
                            </span>
                        </div>

                        {/* 내 아래 순위 */}
                        {belowNeighbor && (
                            <div className="neighbor-ranking">
                                <span className="neighbor-rank">{belowNeighbor.rank}</span>
                                <span className="neighbor-nickname">{belowNeighbor.nickname}</span>
                                <span
                                    className="neighbor-score"
                                    style={{ color: getScoreColor(belowNeighbor.score) }}
                                >
                                    {formatScore(belowNeighbor.score)}
                                </span>
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
};

export default RankingCard;