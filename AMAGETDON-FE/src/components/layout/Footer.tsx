import { Link, useLocation } from 'react-router-dom';
import './Footer.css';

export const Footer = () => {
    const location = useLocation();

    // 현재 경로 확인
    const isActive = (path: string) => location.pathname === path;

    return (
        <footer className="footer">
            <nav className="footer-nav">
                {/* 홈 */}
                <Link
                    to="/"
                    className={`footer-nav-item ${isActive('/') ? 'active' : ''}`}
                >
                    <span className="footer-nav-icon">🏠</span>
                    <span className="footer-nav-label">홈</span>
                </Link>

                {/* 커뮤니티 */}
                <Link
                    to="/community"
                    className={`footer-nav-item ${isActive('/community') ? 'active' : ''}`}
                >
                    <span className="footer-nav-icon">👥</span>
                    <span className="footer-nav-label">커뮤니티</span>
                </Link>

                {/* 랭킹 */}
                <Link
                    to="/ranking"
                    className={`footer-nav-item ${isActive('/ranking') ? 'active' : ''}`}
                >
                    <span className="footer-nav-icon">🏆</span>
                    <span className="footer-nav-label">랭킹</span>
                </Link>

                {/* 마이페이지 */}
                <Link
                    to="/profile"
                    className={`footer-nav-item ${isActive('/profile') ? 'active' : ''}`}
                >
                    <span className="footer-nav-icon">👤</span>
                    <span className="footer-nav-label">마이페이지</span>
                </Link>
            </nav>
        </footer>
    );
};