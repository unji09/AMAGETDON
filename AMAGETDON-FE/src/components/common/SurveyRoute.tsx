/**
 * 설문조사 페이지 전용 라우트 가드
 * - 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
 * - 이미 설문조사를 완료한 사용자(investmentType !== null)는 홈으로 리다이렉트
 */

import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import apiClient from '@/api/client';

interface SurveyRouteProps {
    children: React.ReactNode;
}

interface UserInfo {
    investmentType: 'AGGRESSIVE' | 'NEUTRAL' | 'STABLE' | null;
}

export const SurveyRoute = ({ children }: SurveyRouteProps) => {
    const token = localStorage.getItem('accessToken');
    const [loading, setLoading] = useState(true);
    const [investmentType, setInvestmentType] = useState<string | null | undefined>(undefined);

    useEffect(() => {
        const checkInvestmentType = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await apiClient.get<UserInfo>('/users/me');
                setInvestmentType(response.data.investmentType);
            } catch {
                setInvestmentType(undefined);
            } finally {
                setLoading(false);
            }
        };

        checkInvestmentType();
    }, [token]);

    // 로딩 중
    if (loading) {
        return null;
    }

    // 토큰 없음 → 로그인 페이지로
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 이미 설문조사 완료 (investmentType !== null) → 홈으로
    if (investmentType !== null) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
