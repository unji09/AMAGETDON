/**
 * Layout 컴포넌트
 */

import { Header } from './Header';
import { Footer } from './Footer';
import './Layout.css';
import FloatingChatButton from '@/features/community/components/Floatingchatbutton';


interface LayoutProps {
    children: React.ReactNode;
    /** Footer 표시 여부 */
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
            <FloatingChatButton />
        </div>
    );
};

export default Layout;