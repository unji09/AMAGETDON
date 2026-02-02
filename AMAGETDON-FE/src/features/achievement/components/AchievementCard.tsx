import type { AchievementItem } from '../types/achievement';
import { CATEGORY_LABELS } from '../types/achievement';
import './AchievementCard.css';

interface AchievementCardProps {
    achievement: AchievementItem;
    /** 현재 칭호로 설정된 업적인지 여부 */
    isCurrentTitle: boolean;
    onClick: () => void;
}

/**
 * 개별 업적 카드
 * - 달성: 노란 테두리, 아이콘, 이름, 카테고리, 달성일, 보상
 * - 미달성: 회색 배경, 자물쇠, 이름 + 카테고리만 표시
 * - 칭호 설정된 카드: 별도 뱃지 표시
 */
export const AchievementCard = ({ achievement, isCurrentTitle, onClick }: AchievementCardProps) => {
    const { achievementName, achievementCategory, achievementIcon, isAchieved, achievedAt } = achievement;

    const formattedDate = achievedAt
        ? new Date(achievedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
        : null;

    return (
        <button
            type="button"
            className={`achievement-card ${isAchieved ? 'achievement-card--achieved' : 'achievement-card--locked'}`}
            onClick={onClick}
        >
            {/* shimmer 효과 (달성 카드 전용, overflow:hidden 격리) */}
            {isAchieved && <div className="achievement-card__shimmer" />}

            {/* 칭호 뱃지 */}
            {isCurrentTitle && (
                <span className="achievement-card__title-badge">칭호</span>
            )}

            {/* 아이콘 영역 */}
            <div className="achievement-card__icon">
                {isAchieved && achievementIcon ? (
                    <img src={achievementIcon} alt={achievementName} />
                ) : (
                    <span className="achievement-card__lock">&#128274;</span>
                )}
            </div>

            {/* 보상 뱃지 (달성 시) */}
            {isAchieved && (
                <span className="achievement-card__reward">+1,000,000원</span>
            )}

            {/* 이름 + 카테고리 */}
            <strong className="achievement-card__name">{achievementName}</strong>
            <span className="achievement-card__category">
                {CATEGORY_LABELS[achievementCategory]}
            </span>

            {/* 달성일 (달성 시) / 잠김 표시 (미달성 시) */}
            {isAchieved && formattedDate ? (
                <span className="achievement-card__date">{formattedDate} 달성</span>
            ) : (
                !isAchieved && <span className="achievement-card__status">잠김</span>
            )}
        </button>
    );
};
