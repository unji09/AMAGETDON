import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import './Header.css';

// 사용자 정보 타입 (User 엔티티 기반)
interface UserInfo {
    userId: number;
    nickname: string;
    email: string;
    currentTitle: string | null;
    balance: number;
    totalPoints: number;
    investmentType: 'AGGRESSIVE' | 'NEUTRAL' | 'STABLE' | null;
}

export const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 사용자 정보 API 호출 함수
    const fetchUserInfo = useCallback(async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setIsLoading(false);
                return;
            }

            const response = await apiClient.get<UserInfo>('/users/me');
            setUserInfo(response.data);
        } catch (error) {
            console.error('사용자 정보 조회 실패:', error);
            // 401 에러시 토큰 정리
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 컴포넌트 마운트 시 사용자 정보 로드
    useEffect(() => {
        fetchUserInfo();
    }, [fetchUserInfo]);

    // 네비게이션 아이템 (순서: 홈, 학습, 오답노트, 투자, 업적, 커뮤니티)
    const navItems = [
        {
            path: '/',
            label: '홈',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
            ),
        },
        {
            path: '/learning',
            label: '학습',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
            ),
        },
        {
            path: '/learning/review-note',
            label: '오답노트',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="9" y1="13" x2="15" y2="13"/>
                    <line x1="9" y1="17" x2="15" y2="17"/>
                </svg>
            ),
        },
        {
            path: '/investment',
            label: '투자',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/>
                    <polyline points="16,7 22,7 22,13"/>
                </svg>
            ),
        },
        {
            path: '/achievements',
            label: '업적',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="6"/>
                    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                </svg>
            ),
        },
        {
            path: '/community',
            label: '커뮤니티',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
            ),
        },
    ];

    /**
     * 개선된 isActive 로직
     * - 더 구체적인 경로를 먼저 체크
     * - /learning/review-note가 /learning보다 우선
     */
    const isActive = (path: string) => {
        const currentPath = location.pathname;

        // 홈은 정확히 일치해야 함
        if (path === '/') {
            return currentPath === '/';
        }

        // /learning/review-note 같은 구체적인 경로는 정확히 일치해야 함
        if (path.startsWith('/learning/') && path !== '/learning') {
            return currentPath === path || currentPath.startsWith(path + '/');
        }

        // /learning은 정확히 /learning이거나
        // /learning/챕터ID 형태만 허용 (단, review-note, quiz는 제외)
        if (path === '/learning') {
            if (currentPath === '/learning') return true;
            if (currentPath.startsWith('/learning/review-note')) return false;
            if (currentPath.startsWith('/learning/quiz')) return false;
            return currentPath.startsWith('/learning/');
        }

        // 나머지 경로는 startsWith로 체크
        return currentPath.startsWith(path);
    };

    const handleProfileClick = () => {
        setShowProfileMenu(prev => !prev);
    };

    const handleEditProfile = () => {
        setShowProfileMenu(false);
        navigate('/mypage');
    };

    const handleLogout = () => {
        setShowProfileMenu(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUserInfo(null);
        navigate('/login');
    };

    // 외부 클릭시 프로필 메뉴 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.header-profile-area')) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // 잔액 포맷팅
    const formatBalance = (balance: number) => {
        return balance.toLocaleString();
    };

    return (
        <>
            {/* ========== 데스크톱 상단바 ========== */}
            <header className="header-desktop">
                <div className="header-content">
                    {/* 로고 */}
                    <Link to="/" className="header-logo">
                        <img src="/logo.png" alt="아마Get돈" className="header-logo-img" />
                        <span className="header-logo-text">AMAGETDON</span>
                    </Link>

                    {/* 네비게이션 */}
                    <nav className="header-nav">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`header-nav-link ${isActive(item.path) ? 'active' : ''}`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* 프로필 영역 */}
                    <div className="header-profile-area">
                        {isLoading ? (
                            <div className="header-profile-skeleton" />
                        ) : userInfo ? (
                            <>
                                <button
                                    className="header-profile-btn"
                                    onClick={handleProfileClick}
                                >
                                    <div className="header-profile-avatar">
                                        <span>{userInfo.nickname.charAt(0)}</span>
                                    </div>
                                    <span className="header-profile-name">
                                        {userInfo.nickname}
                                    </span>
                                    <svg
                                        className={`header-profile-arrow ${showProfileMenu ? 'open' : ''}`}
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                    >
                                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                    </svg>
                                </button>

                                {/* 프로필 드롭다운 메뉴 */}
                                {showProfileMenu && (
                                    <div className="header-profile-dropdown">
                                        <div className="profile-dropdown-header">
                                            <span className="profile-dropdown-name">{userInfo.nickname}</span>
                                            {userInfo.currentTitle && (
                                                <span className="profile-dropdown-title">{userInfo.currentTitle}</span>
                                            )}
                                            <span className="profile-dropdown-balance">
                                                {formatBalance(userInfo.balance)} GM
                                            </span>
                                        </div>
                                        <div className="profile-dropdown-divider" />
                                        <button
                                            className="profile-dropdown-item"
                                            onClick={handleEditProfile}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M8 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
                                                <path d="M12.5 10a.83.83 0 0 0 .17.92l.03.03a1 1 0 1 1-1.42 1.42l-.03-.03a.83.83 0 0 0-.92-.17.83.83 0 0 0-.5.76v.1a1 1 0 0 1-2 0v-.06a.83.83 0 0 0-.54-.76.83.83 0 0 0-.92.17l-.03.03a1 1 0 1 1-1.42-1.42l.03-.03a.83.83 0 0 0 .17-.92.83.83 0 0 0-.76-.5h-.1a1 1 0 0 1 0-2h.06a.83.83 0 0 0 .76-.54.83.83 0 0 0-.17-.92l-.03-.03a1 1 0 1 1 1.42-1.42l.03.03a.83.83 0 0 0 .92.17h.04a.83.83 0 0 0 .5-.76v-.1a1 1 0 1 1 2 0v.06c0 .32.19.6.5.76a.83.83 0 0 0 .92-.17l.03-.03a1 1 0 1 1 1.42 1.42l-.03.03a.83.83 0 0 0-.17.92v.04c.16.31.44.5.76.5h.1a1 1 0 0 1 0 2h-.06a.83.83 0 0 0-.76.5Z"/>
                                            </svg>
                                            내 정보 수정
                                        </button>
                                        <div className="profile-dropdown-divider" />
                                        <button
                                            className="profile-dropdown-item logout"
                                            onClick={handleLogout}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M6 14H3.33A1.33 1.33 0 0 1 2 12.67V3.33A1.33 1.33 0 0 1 3.33 2H6"/>
                                                <polyline points="10.67,11.33 14,8 10.67,4.67"/>
                                                <line x1="14" y1="8" x2="6" y2="8"/>
                                            </svg>
                                            로그아웃
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <Link to="/login" className="header-login-btn">
                                로그인
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* ========== 모바일 하단 탭바 ========== */}
            <nav className="mobile-tabbar">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`tabbar-item ${isActive(item.path) ? 'active' : ''}`}
                    >
                        <span className="tabbar-icon">{item.icon}</span>
                        <span className="tabbar-label">{item.label}</span>
                    </Link>
                ))}
            </nav>
        </>
    );
};

export default Header;