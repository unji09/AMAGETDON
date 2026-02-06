/**
 * 로그인 상태에 따라 다른 컴포넌트를 렌더링하는 라우트
 * - 로그인 O: authenticatedComponent 렌더링
 * - 로그인 X: unauthenticatedComponent 렌더링
 */

interface AuthRouteProps {
    authenticatedComponent: React.ReactNode;
    unauthenticatedComponent: React.ReactNode;
}

export const AuthRoute = ({ authenticatedComponent, unauthenticatedComponent }: AuthRouteProps) => {
    const token = localStorage.getItem('accessToken');

    if (token) {
        return <>{authenticatedComponent}</>;
    }

    return <>{unauthenticatedComponent}</>;
};
