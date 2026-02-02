import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { ContainerContent } from '@/components/layout';
import { Loading } from '@/components/common';
import { RoadmapHeader } from '@/features/learning/components/RoadmapHeader';
import { RoadmapTimeline } from '@/features/learning/components/RoadmapTimeline';
import { ChapterDetailModal } from '@/features/learning/components/ChapterDetailModal';
import { getBaseChapters, getSideChapters, getProgress } from '@/api/learningApi';
import type { ChapterItem, ChapterType, ProgressSummary } from '@/features/learning/types/learning';

// 사이드 챕터 성향 타입 (NORMAL 제외)
type SideType = Exclude<ChapterType, 'NORMAL'>;

/**
 * 학습 로드맵 메인 페이지 컴포넌트
 * - 타임라인: NORMAL 챕터 + 선택된 성향의 사이드 챕터를 함께 표시
 * - 성향 토글: 공격형/중립형/안정형 전환 (기본값 = 유저 투자 성향)
 * - 챕터 클릭 시 상세 모달 표시 → 학습 시작 시 해당 챕터 페이지로 이동
 */
export const LearningPage = () => {
    const navigate = useNavigate();
    const [chapters, setChapters] = useState<ChapterItem[]>([]);
    const [sideChapters, setSideChapters] = useState<ChapterItem[]>([]);
    const [summary, setSummary] = useState<ProgressSummary | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<ChapterItem | null>(null);
    const [sideType, setSideType] = useState<SideType>('AGGRESSIVE');
    const [loading, setLoading] = useState(true);

    // 초기 데이터 로딩
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [baseRes, sideRes, progressRes] = await Promise.all([
                    getBaseChapters(),
                    getSideChapters(),
                    getProgress(),
                ]);
                // 응답 데이터 상태에 저장
                setChapters(baseRes.chapters);
                setSideChapters(sideRes.chapters);
                setSummary(progressRes.summary);

                // 유저 투자 성향을 기본 토글로 설정
                const userType = sideRes.userInvestmentType;
                if (userType === 'AGGRESSIVE' || userType === 'NEUTRAL' || userType === 'STABLE') {
                    setSideType(userType);
                }
            } catch {
                // API interceptor가 에러를 처리하여 별도 처리 없음
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 성향 토글 변경 시 해당 타입의 사이드 챕터 다시 조회
    const handleSideTypeChange = useCallback(async (type: SideType) => {
        setSideType(type);
        try {
            const sideRes = await getSideChapters(type);
            setSideChapters(sideRes.chapters);
        } catch {
            // API interceptor가 에러를 처리하여 별도 처리 없음
        }
    }, []);

    // 학습 시작 버튼 클릭 → 챕터 상세 페이지로 이동
    const handleStartLearning = (chapterId: number) => {
        setSelectedChapter(null);
        navigate(`/learning/${chapterId}`);
    };

    // 로딩중 UI
    if (loading) {
        return (
            <Layout>
                <Loading fullScreen />
            </Layout>
        );
    }

    // 메인 렌더링
    return (
        <Layout>
            <ContainerContent>
                <RoadmapHeader
                    summary={summary}
                    sideType={sideType}
                    onSideTypeChange={handleSideTypeChange}
                />
                <RoadmapTimeline
                    chapters={chapters}
                    sideChapters={sideChapters}
                    onChapterClick={setSelectedChapter}
                />
                <ChapterDetailModal
                    chapter={selectedChapter}
                    isOpen={!!selectedChapter}
                    onClose={() => setSelectedChapter(null)}
                    onStartLearning={handleStartLearning}
                />
            </ContainerContent>
        </Layout>
    );
};
