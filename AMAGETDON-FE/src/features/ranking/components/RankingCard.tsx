/**
 * RankingCard - 커뮤니티 페이지 랭킹 카드 컴포넌트
 * S14P11A207-186
 *
 * 파일 위치: src/features/ranking/components/RankingCard.tsx
 */

import { useState, useEffect } from 'react';
import type { RankingType } from '../types/rankingTypes';
import {
    getTopLearningRankings,
    getTopProfitRankings,
    getMyLearningRanking,
    getMyProfitRanking,
} from '@/api/rankingApi';
import './RankingCard.css';

interface RankingCardProps {
    type: RankingType;
}

interface RankingItem {
    rank: number;
    nickname: string;
    score: number;
    isCurrentUser?: boolean;
}

interface MyRankingItem {
    rank: number;
    nickname: string;
    score: number;
}

const RankingCard = ({ type }: RankingCardProps) => {
    const [topRankings, setTopRankings] = useState<RankingItem[]>([]);
    const [myRanking, setMyRanking] = useState<MyRankingItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const title = type === 'profit' ? '수익 랭킹' : '학습 랭킹';
    const scoreColor = type === 'profit' ? '#DC0000' : '#2563EB';

    useEffect(() => {
        const fetchRankings = async () => {
            setLoading(true);
            setError(false);

            try {
                if (type === 'learning') {
                    // 학습 랭킹 TOP 3 조회
                    const rankings = await getTopLearningRankings(3);
                    setTopRankings(
                        rankings.map((r) => ({
                            rank: r.rank,
                            nickname: r.nickname,
                            score: r.totalCorrect,
                            isCurrentUser: r.isCurrentUser,
                        }))
                    );

                    // 내 랭킹 조회 (로그인한 경우에만)
                    try {
                        const myRank = await getMyLearningRanking();
                        if (myRank) {
                            setMyRanking({
                                rank: myRank.rank,
                                nickname: myRank.nickname,
                                score: myRank.totalCorrect,
                            });
                        }
                    } catch {
                        // 내 랭킹 조회 실패는 무시 (로그인 안 한 경우)
                        console.log('내 학습 랭킹 조회 실패 (로그인 필요)');
                    }
                } else {
                    // 수익 랭킹 TOP 3 조회
                    const rankings = await getTopProfitRankings(3);
                    setTopRankings(
                        rankings.map((r) => ({
                            rank: r.rank,
                            nickname: r.nickname,
                            score: r.totalProfit,
                            isCurrentUser: r.isCurrentUser,
                        }))
                    );

                    // 내 랭킹 조회 (로그인한 경우에만)
                    try {
                        const myRank = await getMyProfitRanking();
                        if (myRank) {
                            setMyRanking({
                                rank: myRank.rank,
                                nickname: myRank.nickname,
                                score: myRank.totalProfit,
                            });
                        }
                    } catch {
                        // 내 랭킹 조회 실패는 무시 (로그인 안 한 경우)
                        console.log('내 수익 랭킹 조회 실패 (로그인 필요)');
                    }
                }
            } catch (err) {
                console.error('랭킹 조회 실패:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchRankings();
    }, [type]);

    // 점수 포맷팅
    const formatScore = (score: number) => {
        if (type === 'learning') {
            return `${score.toLocaleString()} P`;
        } else {
            const prefix = score >= 0 ? '+' : '';
            return `${prefix}${score.toLocaleString()}`;
        }
    };

    // 점수 색상 클래스
    const getScoreClass = (score: number) => {
        if (type === 'learning') {
            return 'score-learning';
        }
        return score >= 0 ? 'score-positive' : 'score-negative';
    };

    // 로딩 상태
    if (loading) {
        return (
            <div className="ranking-card">
                <div className="ranking-card-header">
                    <span className="ranking-card-title">{title}</span>
                    <span className="ranking-card-date">오늘</span>
                </div>
                <div className="ranking-card-loading">
                    <span>로딩 중...</span>
                </div>
            </div>
        );
    }

    // 에러 또는 빈 상태
    if (error || topRankings.length === 0) {
        return (
            <div className="ranking-card">
                <div className="ranking-card-header">
                    <span className="ranking-card-title">{title}</span>
                    <span className="ranking-card-date">오늘</span>
                </div>
                <div className="ranking-empty">
                    {error ? '랭킹을 불러올 수 없습니다' : '아직 랭킹 정보가 없습니다'}
                </div>
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
            <div className="ranking-card-list">
                {topRankings.map((item) => (
                    <div key={item.rank} className="ranking-item">
                        <span className="ranking-item-rank">{item.rank}</span>
                        <span className="ranking-item-nickname">{item.nickname}</span>
                        <span className={`ranking-item-score ${getScoreClass(item.score)}`}>
                            {formatScore(item.score)}
                        </span>
                    </div>
                ))}
            </div>

            {/* 내 랭킹 */}
            {myRanking && (
                <div className="my-ranking-section">
                    <div className="my-ranking-item">
                        <span
                            className="my-ranking-rank"
                            style={{ color: scoreColor }}
                        >
                            {myRanking.rank.toLocaleString()}
                        </span>
                        <span className="my-ranking-nickname">{myRanking.nickname}</span>
                        <span
                            className="my-ranking-badge"
                            style={{ backgroundColor: scoreColor }}
                        >
                            ME
                        </span>
                        <span className={`my-ranking-score ${getScoreClass(myRanking.score)}`}>
                            {formatScore(myRanking.score)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RankingCard;