import type { ProgressSummary, ChapterType } from '../../types/learning.ts';
import './RoadmapHeader.css';

//사이드 챕터 성향 타입 (NORMAL 제외)
type SideType = Exclude<ChapterType, 'NORMAL'>;

//성향 토글 버튼에 표시할 한글 라벨
const SIDE_TYPE_LABELS: Record<SideType, string> = {
    AGGRESSIVE: '공격형',
    NEUTRAL: '중립형',
    STABLE: '안정형',
};

//챕터 유형별 한글 라벨 매핑
const TYPE_LABELS: Record<ChapterType, string> = {
    NORMAL: '기본',
    AGGRESSIVE: '공격형',
    NEUTRAL: '중립형',
    STABLE: '안정형',
};

interface RoadmapHeaderProps {
    summary: ProgressSummary | null;
    sideType: SideType;
    onSideTypeChange: (type: SideType) => void;
}

/**
 * 학습 로드맵 헤더 컴포넌트
 * - 페이지 제목 및 부제목
 * - 성향별 사이드 챕터 토글 (공격형/중립형/안정형)
 * - 전체 진행률 프로그레스 바
 * - 유형별 세부 진행률 표시 (기본/공격형/중립형/안정형)
 */
export const RoadmapHeader = ({ summary, sideType, onSideTypeChange }: RoadmapHeaderProps) => {

    // 완료율 계산 함수 (0 나누기 방지)
    const safeRate = (completed: number, total: number) =>
        total > 0 ? Math.round((completed / total) * 100) : 0;

    // 전체 진행률 계산
    const overallRate = summary
        ? safeRate(summary.completedChapters, summary.totalChapters)
        : 0;

    const sideTypes: SideType[] = ['AGGRESSIVE', 'NEUTRAL', 'STABLE'];

    return (
        <div className="roadmap-header">
            {/* 상단: 제목 + 성향 토글 */}
            <div className="roadmap-header__top">
                <div className="roadmap-header__title-area">
                    <h1 className="roadmap-header__title">나의 학습 로드맵</h1>
                    <p className="roadmap-header__subtitle">금융 마스터를 향한 여정을 계속하세요.</p>
                </div>
                <div className="roadmap-header__toggle">
                    {sideTypes.map((type) => (
                        <button
                            key={type}
                            type="button"
                            className={`roadmap-header__toggle-btn ${sideType === type ? 'roadmap-header__toggle-btn--active' : ''}`}
                            onClick={() => onSideTypeChange(type)}
                        >
                            {SIDE_TYPE_LABELS[type]}
                        </button>
                    ))}
                </div>
            </div>

            {/* 하단: 진행률 섹션 */}
            <div className="roadmap-header__progress-section">
                {/* 전체 커리큘럼 달성도 */}
                <div className="roadmap-header__progress">
                    <div className="roadmap-header__progress-info">
                        <span className="roadmap-header__progress-label">전체 커리큘럼 달성도</span>
                        <span className="roadmap-header__progress-percent">{overallRate}%</span>
                    </div>
                    <div className="roadmap-header__progress-bar">
                        <div
                            className="roadmap-header__progress-fill"
                            style={{ width: `${overallRate}%` }}
                        />
                    </div>
                </div>

                {/* 유형별 세부 달성도 */}
                {summary && (
                    <div className="roadmap-header__type-progress">
                        {(Object.entries(summary.byType) as [ChapterType, { total: number; completed: number }][]).map(
                            ([type, data]) => {
                                const rate = safeRate(data.completed, data.total);
                                return (
                                    <div key={type} className="roadmap-header__type-item">
                                        <div className="roadmap-header__type-info">
                                            <span className="roadmap-header__type-label">{TYPE_LABELS[type]}</span>
                                            <span className="roadmap-header__type-count">
                                                {data.completed}/{data.total}
                                            </span>
                                        </div>
                                        <div className="roadmap-header__type-bar">
                                            <div
                                                className={`roadmap-header__type-fill roadmap-header__type-fill--${type.toLowerCase()}`}
                                                style={{ width: `${rate}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
