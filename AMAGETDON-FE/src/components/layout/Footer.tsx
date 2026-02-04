/**
 * Footer 컴포넌트
 * 페이지 끝에만 표시 (fixed 아님)
 * 간소화된 저작권 정보만 표시
 */

import './Footer.css';

export const Footer = () => {
    return (
        <footer className="footer">
            <span className="footer-copyright">
                © 2025 아마Get돈. All rights reserved.
            </span>
        </footer>
    );
};

export default Footer;