import { useEffect, useRef } from 'react';
import type { AchievementItem, AchievementFilter, AchievementCategory } from '../types/achievement';
import { CATEGORY_SECTION_TITLES } from '../types/achievement';
import { AchievementCard } from './AchievementCard';
import './AchievementGrid.css';

/** 카테고리 표시 순서 */
const CATEGORY_ORDER: AchievementCategory[] = [
    'ATTENDANCE', 'TRADE', 'COMMUNITY', 'ASSET',
    'LEARNING', 'INDUSTRY', 'TRADE_TIME', 'RETURN_RATE',
];

interface AchievementGridProps {
    achievements: AchievementItem[];
    filter: AchievementFilter;
    onFilterChange: (filter: AchievementFilter) => void;
    onCardClick: (achievement: AchievementItem) => void;
    /** 현재 설정된 칭호 (카드에 뱃지 표시용) */
    currentTitle: string | null;
}

/** 필터 탭 라벨 */
const FILTER_LABELS: Record<AchievementFilter, string> = {
    ALL: '전체 보기',
    ACHIEVED: '달성 완료',
    LOCKED: '진행 중 (잠김)',
};

/**
 * 업적 그리드
 * - 필터 탭 (전체 / 달성 / 잠김)
 * - 카테고리별 그룹핑 + 카드 그리드
 * - IntersectionObserver 스크롤 fade-in 애니메이션
 */
export const AchievementGrid = ({ achievements, filter, onFilterChange, onCardClick, currentTitle }: AchievementGridProps) => {
    const gridRef = useRef<HTMLDivElement>(null);

    // 카테고리별로 그룹핑
    const grouped = CATEGORY_ORDER
        .map((category) => ({
            category,
            label: CATEGORY_SECTION_TITLES[category],
            items: achievements.filter((a) => a.achievementCategory === category),
        }))
        .filter((group) => group.items.length > 0);

    // 스크롤 fade-in 애니메이션
    useEffect(() => {
        const container = gridRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('achievement-visible');
                    }
                });
            },
            { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
        );

        const cards = container.querySelectorAll('.achievement-card');
        cards.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [achievements, filter]);

    return (
        <div className="achievement-grid" ref={gridRef}>
            {/* 필터 탭 */}
            <div className="achievement-grid__filters">
                {(Object.keys(FILTER_LABELS) as AchievementFilter[]).map((f) => (
                    <button
                        key={f}
                        type="button"
                        className={`achievement-grid__filter-btn ${filter === f ? 'achievement-grid__filter-btn--active' : ''}`}
                        onClick={() => onFilterChange(f)}
                    >
                        {FILTER_LABELS[f]}
                    </button>
                ))}
            </div>

            {/* 카테고리별 그룹 */}
            {grouped.length === 0 ? (
                <p className="achievement-grid__empty">해당하는 업적이 없습니다.</p>
            ) : (
                grouped.map(({ category, label, items }) => (
                    <section key={category} className="achievement-grid__group">
                        <h2 className="achievement-grid__group-title">{label}</h2>
                        <div className="achievement-grid__cards">
                            {items.map((achievement) => (
                                <AchievementCard
                                    key={achievement.achievementId}
                                    achievement={achievement}
                                    isCurrentTitle={currentTitle === achievement.achievementName}
                                    onClick={() => onCardClick(achievement)}
                                />
                            ))}
                        </div>
                    </section>
                ))
            )}
        </div>
    );
};
