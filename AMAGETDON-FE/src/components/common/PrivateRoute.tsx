/**
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 * 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
 */

import { Navigate, useLocation } from 'react-router-dom';

interface PrivateRouteProps {
    children: React.ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
    const location = useLocation();
    const token = localStorage.getItem('accessToken');

    if (!token) {
        // 현재 경로를 state로 전달하여 로그인 후 돌아올 수 있도록 함
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
