import { Link } from 'react-router-dom';
import './Header.css';

export const Header = () => {
    const isLoggedIn = false;
    const userName = '사용자';

    return (
        <header className="header">
            <div className="header-content">
                {/* 로고 */}
                <Link to="/" className="header-logo">
                    <h1>AMAGETDON</h1>
                </Link>

                {/* 네비게이션 */}
                <nav className="header-nav">
                    <Link to="/community" className="header-nav-link">
                        커뮤니티
                    </Link>
                    <Link to="/ranking" className="header-nav-link">
                        랭킹
                    </Link>
                </nav>

                {/* 사용자 정보 */}
                <div className="header-user">
                    {isLoggedIn ? (
                        <>
                            <span className="header-user-name">{userName}님</span>
                            <button className="header-logout-btn">로그아웃</button>
                        </>
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