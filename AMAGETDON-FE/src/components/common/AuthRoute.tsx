/**
 * 로그인 상태에 따라 다른 컴포넌트를 렌더링하는 라우트
 * - 로그인 O + 설문 완료: authenticatedComponent 렌더링
 * - 로그인 O + 설문 미완료: /survey로 리다이렉트
 * - 로그인 X: unauthenticatedComponent 렌더링
 */

import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import apiClient from '@/api/client';

interface AuthRouteProps {
    authenticatedComponent: React.ReactNode;
    unauthenticatedComponent: React.ReactNode;
}

interface UserInfo {
    investmentType: 'AGGRESSIVE' | 'NEUTRAL' | 'STABLE' | null;
}

export const AuthRoute = ({ authenticatedComponent, unauthenticatedComponent }: AuthRouteProps) => {
    const token = localStorage.getItem('accessToken');
    const [loading, setLoading] = useState(!!token);
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

    // 로그인 안 됨
    if (!token) {
        return <>{unauthenticatedComponent}</>;
    }

    // 로그인 됐지만 설문 미완료
    if (investmentType === null) {
        return <Navigate to="/survey" replace />;
    }

    // 로그인 + 설문 완료
    return <>{authenticatedComponent}</>;
};
