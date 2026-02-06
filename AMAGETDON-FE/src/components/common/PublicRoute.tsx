/**
 * 비로그인 사용자만 접근 가능한 라우트 컴포넌트
 * 로그인한 사용자는 홈 페이지로 리다이렉트
 */

import { Navigate, useLocation } from 'react-router-dom';

interface PublicRouteProps {
    children: React.ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
    const location = useLocation();
    const token = localStorage.getItem('accessToken');

    if (token) {
        // 로그인 후 돌아가려던 페이지가 있으면 그곳으로, 없으면 홈으로
        const from = location.state?.from?.pathname || '/';
        return <Navigate to={from} replace />;
    }

    return <>{children}</>;
};
