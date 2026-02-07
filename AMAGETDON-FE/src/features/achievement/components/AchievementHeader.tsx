import { Sparkles, Lock, Loader2, ChevronRight } from 'lucide-react';
import './AchievementHeader.css';

interface AchievementHeaderProps {
    currentTitle: string | null;
    totalCount: number;
    achievedCount: number;
    onAnalyzeClick: () => void;
    isAnalyzing?: boolean;
}

const MIN_ACHIEVEMENTS_FOR_ANALYSIS = 5;

/**
 * 업적 페이지 상단
 * - 제목 + 칭호 뱃지 (우측)
 * - 설명
 * - 달성 현황 프로그레스 바 (총 보상 포함)
 * - 성향 분석 카드
 */
export const AchievementHeader = ({
    currentTitle,
    totalCount,
    achievedCount,
    onAnalyzeClick,
    isAnalyzing = false,
}: AchievementHeaderProps) => {
    const progressPercent = totalCount > 0 ? (achievedCount / totalCount) * 100 : 0;
    const canAnalyze = achievedCount >= MIN_ACHIEVEMENTS_FOR_ANALYSIS;
    const remaining = MIN_ACHIEVEMENTS_FOR_ANALYSIS - achievedCount;

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

            {/* 성향 분석 카드 */}
            <div
                className={`analysis-card ${canAnalyze ? 'analysis-card--active' : 'analysis-card--locked'} ${isAnalyzing ? 'analysis-card--loading' : ''}`}
                onClick={canAnalyze && !isAnalyzing ? onAnalyzeClick : undefined}
            >
                <div className="analysis-card__icon">
                    {isAnalyzing ? (
                        <Loader2 size={28} className="analysis-card__spinner" />
                    ) : canAnalyze ? (
                        <Sparkles size={28} />
                    ) : (
                        <Lock size={24} />
                    )}
                </div>
                <div className="analysis-card__content">
                    <h3 className="analysis-card__title">
                        {isAnalyzing ? '성향 분석 중...' : '업적 기반 투자 성향 분석'}
                    </h3>
                    <p className="analysis-card__desc">
                        {isAnalyzing
                            ? 'AI가 당신의 업적 패턴을 분석하고 있습니다'
                            : canAnalyze
                                ? '"내 성과 속에 숨겨진 투자 성향? AI 분석으로 확인하기'
                                : `업적 ${remaining}개 더 달성하면 분석할 수 있어요`}
                    </p>
                </div>
                {canAnalyze && !isAnalyzing && (
                    <ChevronRight size={24} className="analysis-card__arrow" />
                )}
                {!canAnalyze && (
                    <div className="analysis-card__progress">
                        <span className="analysis-card__progress-text">{achievedCount}/{MIN_ACHIEVEMENTS_FOR_ANALYSIS}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
