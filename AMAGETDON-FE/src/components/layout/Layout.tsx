/**
 * Layout 컴포넌트
 * Header + Main + Footer 조합
 * 반응형 지원 (데스크톱/모바일)
 */

import { Header } from './Header';
import { Footer } from './Footer';
import './Layout.css';

interface LayoutProps {
    children: React.ReactNode;
    /** Footer 표시 여부 (기본: true) */
    showFooter?: boolean;
}

export const Layout = ({ children, showFooter = true }: LayoutProps) => {
    return (
        <div className="layout">
            <Header />
            <main className="layout-main">
                {children}
            </main>
            {showFooter && <Footer />}
        </div>
    );
};

export default Layout;