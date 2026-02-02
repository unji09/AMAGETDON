import './AchievementHeader.css';

interface AchievementHeaderProps {
    currentTitle: string | null;
    totalCount: number;
    achievedCount: number;
}

/**
 * 업적 페이지 상단
 * - 제목 + 칭호 뱃지 (우측)
 * - 설명
 * - 달성 현황 프로그레스 바 (총 보상 포함)
 */
export const AchievementHeader = ({ currentTitle, totalCount, achievedCount }: AchievementHeaderProps) => {
    const progressPercent = totalCount > 0 ? (achievedCount / totalCount) * 100 : 0;

    return (
        <div className="achievement-header">
            {/* 제목 행: 좌측 제목 + 우측 칭호 뱃지 */}
            <div className="achievement-header__top">
                <div>
                    <h1 className="achievement-header__title">나의 업적</h1>
                    <p className="achievement-header__subtitle">
                        투자 여정에서 달성한 업적을 확인하고, 칭호를 설정하세요.
                    </p>
                </div>
                <div className="achievement-header__title-card">
                    <span className="achievement-header__title-label">현재 칭호</span>
                    {currentTitle ? (
                        <strong className="achievement-header__title-value">{currentTitle}</strong>
                    ) : (
                        <span className="achievement-header__title-empty">미설정</span>
                    )}
                </div>
            </div>

            {/* 달성 현황 프로그레스 바 + 총 보상 */}
            <div className="achievement-header__progress-card">
                <div className="achievement-header__progress-top">
                    <span className="achievement-header__progress-label">업적 달성 현황</span>
                    <span className="achievement-header__progress-count">
                        <strong>{achievedCount}</strong> / {totalCount}
                    </span>
                </div>
                <div className="achievement-header__progress-bar">
                    <div
                        className="achievement-header__progress-fill"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
