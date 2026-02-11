/**
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 * - 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
 * - 로그인했지만 설문조사를 완료하지 않은 사용자는 설문조사 페이지로 리다이렉트
 */

import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import apiClient from '@/api/client';

interface PrivateRouteProps {
    children: React.ReactNode;
}

interface UserInfo {
    investmentType: 'AGGRESSIVE' | 'NEUTRAL' | 'STABLE' | null;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
    const location = useLocation();
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
                // 에러 시 토큰 문제로 간주
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
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 설문조사 미완료 (investmentType === null) → 설문조사 페이지로
    // 단, 현재 설문조사 페이지면 리다이렉트 안함
    if (investmentType === null && location.pathname !== '/survey') {
        return <Navigate to="/survey" replace />;
    }

    return <>{children}</>;
};
