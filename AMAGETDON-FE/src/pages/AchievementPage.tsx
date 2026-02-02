import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout';
import { ContainerContent } from '@/components/layout';
import { Loading } from '@/components/common';
import { AchievementHeader } from '@/features/achievement/components/AchievementHeader';
import { AchievementGrid } from '@/features/achievement/components/AchievementGrid';
import { AchievementDetailModal } from '@/features/achievement/components/AchievementDetailModal';
import { getMyAchievements, getUserTitle } from '@/api/achievementApi';
import type { AchievementItem, AchievementFilter, AchievementResponse } from '@/features/achievement/types/achievement';

/**
 * 업적 페이지
 * - 전체 업적을 1회 조회 후 클라이언트에서 필터링 (깜빡임 방지)
 * - 현재 칭호 조회 + 변경
 * - 업적 상세 모달
 */
export const AchievementPage = () => {
    const [data, setData] = useState<AchievementResponse | null>(null);
    const [currentTitle, setCurrentTitle] = useState<string | null>(null);
    const [filter, setFilter] = useState<AchievementFilter>('ALL');
    const [selectedAchievement, setSelectedAchievement] = useState<AchievementItem | null>(null);
    const [loading, setLoading] = useState(true);

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

    // 클라이언트 필터링 (API 재호출 없이 즉시 반영)
    const filteredAchievements = useMemo(() => {
        if (!data) return [];
        if (filter === 'ALL') return data.achievements;
        if (filter === 'ACHIEVED') return data.achievements.filter((a) => a.isAchieved);
        return data.achievements.filter((a) => !a.isAchieved);
    }, [data, filter]);

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
            </ContainerContent>
        </Layout>
    );
};
