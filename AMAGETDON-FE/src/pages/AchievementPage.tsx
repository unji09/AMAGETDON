import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout';
import { ContainerContent } from '@/components/layout';
import { Loading, Toast } from '@/components/common';
import { AchievementHeader } from '@/features/achievement/components/AchievementHeader';
import { AchievementGrid } from '@/features/achievement/components/AchievementGrid';
import { AchievementDetailModal } from '@/features/achievement/components/AchievementDetailModal';
import { PersonalityAnalysisModal } from '@/features/achievement/components/PersonalityAnalysisModal';
import { getMyAchievements, getUserTitle, analyzePersonality, updateInvestmentType } from '@/api/achievementApi';
import type { PersonalityAnalyzeResponse } from '@/api/achievementApi';
import type { AchievementItem, AchievementFilter, AchievementResponse } from '@/features/achievement/types/achievement';

/**
 * 업적 페이지
 * - 전체 업적을 1회 조회 후 클라이언트에서 필터링 (깜빡임 방지)
 * - 현재 칭호 조회 + 변경
 * - 업적 상세 모달
 * - 업적 기반 성향 분석 (버튼 클릭 시)
 */
export const AchievementPage = () => {
    const [data, setData] = useState<AchievementResponse | null>(null);
    const [currentTitle, setCurrentTitle] = useState<string | null>(null);
    const [filter, setFilter] = useState<AchievementFilter>('ALL');
    const [selectedAchievement, setSelectedAchievement] = useState<AchievementItem | null>(null);
    const [loading, setLoading] = useState(true);

    // 성향 분석 관련 상태
    const [analysisResult, setAnalysisResult] = useState<PersonalityAnalyzeResponse | null>(null);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // 업적 + 칭호 초기 1회 로드 (필터는 클라이언트에서 처리)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [achievementRes, titleRes] = await Promise.all([
                    getMyAchievements('ALL'),
                    getUserTitle(),
                ]);
                setData(achievementRes);
                setCurrentTitle(titleRes);
            } catch {
                // 에러 시 빈 상태 유지
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 성향 분석 버튼 클릭 핸들러 (최소 1초 로딩)
    const handleAnalyzeClick = async () => {
        setAnalysisLoading(true);
        try {
            const [result] = await Promise.all([
                analyzePersonality(),
                new Promise(resolve => setTimeout(resolve, 1000)),
            ]);
            if (result.success && result.can_analyze) {
                setAnalysisResult(result);
                setShowAnalysisModal(true);
            } else {
                setToastMsg(result.message || '성향 분석을 진행할 수 없습니다.');
            }
        } catch (error) {
            console.error('성향 분석 실패:', error);
            setToastMsg('성향 분석 중 오류가 발생했습니다.');
        } finally {
            setAnalysisLoading(false);
        }
    };

    // 클라이언트 필터링 (API 재호출 없이 즉시 반영)
    const filteredAchievements = useMemo(() => {
        if (!data) return [];
        if (filter === 'ALL') return data.achievements;
        if (filter === 'ACHIEVED') return data.achievements.filter((a) => a.isAchieved);
        return data.achievements.filter((a) => !a.isAchieved);
    }, [data, filter]);

    // 성향 선택 확정 핸들러
    const handleAnalysisConfirm = async (selectedType: 'AGGRESSIVE' | 'NEUTRAL' | 'STABLE') => {
        setAnalysisLoading(true);
        try {
            await updateInvestmentType(selectedType);
            setToastMsg('투자 성향이 변경되었습니다.');
            setShowAnalysisModal(false);
            setAnalysisResult(null);
            // 헤더 프로필 아이콘 갱신
            window.dispatchEvent(new Event('userInfoUpdated'));
        } catch {
            setToastMsg('성향 변경에 실패했습니다.');
        } finally {
            setAnalysisLoading(false);
        }
    };

    if (loading || !data) {
        return (
            <Layout>
                <Loading fullScreen />
            </Layout>
        );
    }

    return (
        <Layout>
            <ContainerContent>
                <AchievementHeader
                    currentTitle={currentTitle}
                    totalCount={data.totalCount}
                    achievedCount={data.achievedCount}
                    onAnalyzeClick={handleAnalyzeClick}
                    isAnalyzing={analysisLoading}
                />
                <AchievementGrid
                    achievements={filteredAchievements}
                    filter={filter}
                    onFilterChange={setFilter}
                    onCardClick={setSelectedAchievement}
                    currentTitle={currentTitle}
                />
                <AchievementDetailModal
                    achievement={selectedAchievement}
                    currentTitle={currentTitle}
                    onClose={() => setSelectedAchievement(null)}
                    onTitleChanged={setCurrentTitle}
                />
                <PersonalityAnalysisModal
                    isOpen={showAnalysisModal}
                    result={analysisResult}
                    onClose={() => {
                        setShowAnalysisModal(false);
                        setAnalysisResult(null);
                    }}
                    onConfirm={handleAnalysisConfirm}
                    loading={analysisLoading}
                />
                {toastMsg && (
                    <Toast
                        message={toastMsg}
                        type="success"
                        duration={3000}
                        onClose={() => setToastMsg(null)}
                    />
                )}
            </ContainerContent>
        </Layout>
    );
};
