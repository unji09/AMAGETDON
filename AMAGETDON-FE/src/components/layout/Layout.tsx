import { Header } from './Header';
import { Footer } from './Footer';
import './Layout.css';

interface LayoutProps {
    children: React.ReactNode;
}

/**
 * 전체 레이아웃 컴포넌트
 * Header + Main + Footer 조합
 */
export const Layout = ({ children }: LayoutProps) => {
    return (
        <div className="layout">
            <Header />
            <main className="layout-main">
                {children}
            </main>
            <Footer />
        </div>
    );
};