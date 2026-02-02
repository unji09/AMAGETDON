import { Link, useLocation } from 'react-router-dom';
import { useAuthUser } from '@/features/user/hooks/authUser';
import './Header.css';

/**
 * Header 컴포넌트
 */
export const Header = () => {
    const location = useLocation();
    const { user, isAuthenticated } = useAuthUser();

    return (
        <header className="header">
            <div className="header-content">
                {/* 로고 */}
                <Link to="/" className="header-logo">
                    <img src="/logo.png" alt="아마Get돈" className="header-logo-img" />
                    <span className="header-logo-text">AMAGETDON</span>
                </Link>

                {/* 네비게이션 */}
                <nav className="header-nav">
                    <Link
                        to="/"
                        className={`header-nav-link ${location.pathname === '/' ? 'active' : ''}`}
                    >
                        홈
                    </Link>
                    <Link
                        to="/community"
                        className={`header-nav-link ${location.pathname === '/community' ? 'active' : ''}`}
                    >
                        커뮤니티
                    </Link>
                    <Link
                        to="/learning"
                        className={`header-nav-link ${location.pathname === '/learning' ? 'active' : ''}`}
                    >
                        투자 강의
                    </Link>
                    <Link
                        to="/mypage"
                        className={`header-nav-link ${location.pathname === '/mypage' ? 'active' : ''}`}
                    >
                        마이페이지
                    </Link>
                </nav>

                {/* 프로필/로그인 */}
                <div className="header-profile">
                    {isAuthenticated ? (
                        <div className="header-profile-circle">
                            <span>{user?.nickname?.charAt(0) ?? '?'}</span>
                        </div>
                    ) : (
                        <Link to="/login" className="header-login-btn">
                            로그인
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};