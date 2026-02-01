import './Footer.css';

/**
 * Footer 컴포넌트
 */
export const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
        <span className="footer-copyright">
          © 2025 아마Get돈. All rights reserved.
        </span>
                <nav className="footer-links">
                    <a href="#" className="footer-link">이용약관</a>
                    <a href="#" className="footer-link privacy">개인정보처리방침</a>
                    <a href="#" className="footer-link">고객센터</a>
                </nav>
            </div>
        </footer>
    );
};