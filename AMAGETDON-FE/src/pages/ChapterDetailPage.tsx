import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { ContainerContent } from '@/components/layout';
import { Loading } from '@/components/common';
import { ChapterContent } from '@/features/learning/components/chapter/ChapterContent.tsx';
import { getChapterDetail, getBaseChapters, getSideChapters } from '@/api/learningApi';
import type { ChapterDetailResponse, ChapterItem } from '@/features/learning/types/learning';

/**
 * 챕터 본문 조회 페이지
 * - URL 파라미터의 chapterId로 챕터 상세 데이터 로드
 * - 이전/다음 이동을 위해 전체 챕터 목록도 함께 조회
 * - 잠긴 챕터 접근 시 403 → 로드맵 페이지로 리다이렉트
 */
export const ChapterDetailPage = () => {
    const { chapterId } = useParams<{ chapterId: string }>();
    const navigate = useNavigate();
    const [chapter, setChapter] = useState<ChapterDetailResponse | null>(null);
    const [siblings, setSiblings] = useState<ChapterItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!chapterId) return;

            setLoading(true);
            try {
                // 챕터 상세 + 형제 챕터 목록 병렬 조회
                const [detailRes, baseRes, sideRes] = await Promise.all([
                    getChapterDetail(Number(chapterId)),
                    getBaseChapters(),
                    getSideChapters(),
                ]);
                setChapter(detailRes);

                // NORMAL + 사이드 챕터를 합쳐서 형제 목록 구성
                const allChapters = [...baseRes.chapters, ...sideRes.chapters];
                setSiblings(allChapters);
            } catch {
                // 403 (잠긴 챕터) 등 에러 시 로드맵으로 이동
                navigate('/learning', { replace: true });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [chapterId, navigate]);

    // 로딩중
    if (loading || !chapter) {
        return (
            <Layout>
                <Loading fullScreen />
            </Layout>
        );
    }

    return (
        <Layout>
            <ContainerContent>
                <ChapterContent chapter={chapter} siblings={siblings} />
            </ContainerContent>
        </Layout>
    );
};
