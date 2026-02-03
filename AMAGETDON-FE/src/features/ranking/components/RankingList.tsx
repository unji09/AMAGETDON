/**
 * 랭킹 전체 목록 컴포넌트
 */

import { useState, useEffect, useCallback } from 'react';
import type { RankingType } from '../types/rankingTypes';
import {
    getLearningRankings,
    getProfitRankings,
} from '@/api/rankingApi';
import './RankingList.css';

interface RankingListProps {
    type: RankingType;
}

interface RankingItem {
    rank: number;
    nickname: string;
    score: number;
    isCurrentUser: boolean;
}

const PAGE_SIZE = 10;

const RankingList = ({ type }: RankingListProps) => {
    const [rankings, setRankings] = useState<RankingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const title = type === 'profit' ? '수익 랭킹' : '학습 랭킹';

    // 데이터 로드
    const loadRankings = useCallback(async (page: number, append: boolean = false) => {
        try {
            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(false);

            let data;
            if (type === 'learning') {
                data = await getLearningRankings(page, PAGE_SIZE);
                const items = data.rankings.map((r) => ({
                    rank: r.rank,
                    nickname: r.nickname,
                    score: r.totalCorrect,
                    isCurrentUser: r.isCurrentUser,
                }));

                if (append) {
                    setRankings((prev) => [...prev, ...items]);
                } else {
                    setRankings(items);
                    setUpdatedAt(data.updatedAt);
                }
            } else {
                data = await getProfitRankings(page, PAGE_SIZE);
                const items = data.rankings.map((r) => ({
                    rank: r.rank,
                    nickname: r.nickname,
                    score: r.totalProfit,
                    isCurrentUser: r.isCurrentUser,
                }));

                if (append) {
                    setRankings((prev) => [...prev, ...items]);
                } else {
                    setRankings(items);
                    setUpdatedAt(data.updatedAt);
                }
            }

            setTotalElements(data.totalElements);
            setCurrentPage(data.currentPage);
            setHasMore(data.rankings.length === PAGE_SIZE);

        } catch (err) {
            console.error('랭킹 로드 실패:', err);
            setError(true);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [type]);

    // 타입 변경 시 초기화 및 로드
    useEffect(() => {
        setRankings([]);
        setCurrentPage(0);
        setHasMore(true);
        loadRankings(0, false);
    }, [type, loadRankings]);

    // 더보기 클릭
    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            loadRankings(currentPage + 1, true);
        }
    };

    // 업데이트 시간 포맷
    const formatUpdatedAt = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${month}월 ${day}일 ${hours}:${minutes} 기준`;
    };

    // 점수 포맷팅
    const formatScore = (score: number) => {
        if (type === 'learning') {
            return `${score.toLocaleString()} P`;
        } else {
            const prefix = score >= 0 ? '+' : '';
            return `${prefix}${score.toLocaleString()}원`;
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
            <div className="ranking-list">
                <div className="ranking-list-header">
                    <h2 className="ranking-list-title">{title}</h2>
                </div>
                <div className="ranking-list-loading">
                    <div className="loading-spinner" />
                    <p>랭킹을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    // 에러 상태
    if (error) {
        return (
            <div className="ranking-list">
                <div className="ranking-list-header">
                    <h2 className="ranking-list-title">{title}</h2>
                </div>
                <div className="ranking-list-error">
                    <p>랭킹을 불러오는데 실패했습니다.</p>
                    <button onClick={() => loadRankings(0, false)}>다시 시도</button>
                </div>
            </div>
        );
    }

    // 빈 상태
    if (rankings.length === 0) {
        return (
            <div className="ranking-list">
                <div className="ranking-list-header">
                    <h2 className="ranking-list-title">{title}</h2>
                </div>
                <div className="ranking-list-empty">
                    <div className="empty-icon">🏆</div>
                    <p>아직 랭킹 정보가 없습니다.</p>
                    <span>
                        {type === 'learning'
                            ? '퀴즈를 풀어 랭킹에 도전해보세요!'
                            : '투자를 시작해 랭킹에 도전해보세요!'}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="ranking-list">
            {/* 헤더 */}
            <div className="ranking-list-header">
                <h2 className="ranking-list-title">{title}</h2>
                {updatedAt && (
                    <span className="ranking-list-updated">{formatUpdatedAt(updatedAt)}</span>
                )}
            </div>

            {/* 총 인원 */}
            <div className="ranking-list-info">
                <span>총 {totalElements.toLocaleString()}명</span>
            </div>

            {/* 랭킹 목록 */}
            <div className="ranking-list-items">
                {rankings.map((item, index) => (
                    <div
                        key={`${item.rank}-${index}`}
                        className={`ranking-list-item ${item.isCurrentUser ? 'is-me' : ''}`}
                    >
                        <span className="item-rank">{item.rank}</span>
                        <span className="item-nickname">
                            {item.nickname}
                            {item.isCurrentUser && <span className="me-badge">ME</span>}
                        </span>
                        <span className={`item-score ${getScoreClass(item.score)}`}>
                            {formatScore(item.score)}
                        </span>
                    </div>
                ))}
            </div>

            {/* 더보기 버튼 */}
            {hasMore && (
                <div className="ranking-list-more">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="load-more-btn"
                    >
                        {loadingMore ? (
                            <>
                                <span className="btn-spinner" />
                                불러오는 중...
                            </>
                        ) : (
                            '더보기'
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RankingList;