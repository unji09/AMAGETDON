import { useKakaoLogin } from "../hooks/useKakaoLogin";
import './KakaoLoginButton.css';

const KakaoIcon = () => (
    <svg className="kakao-login-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.31 4.73 6.73-.15.54-.97 3.48-1 3.64 0 .09.03.18.1.24.08.07.18.09.28.06.37-.06 4.3-2.82 4.98-3.3.63.09 1.27.13 1.91.13 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
    </svg>
);

export const KakaoLoginButton = () => {
    const { loginWithKakao } = useKakaoLogin();

    return (
        <button
            type="button"
            className="kakao-login-btn"
            onClick={loginWithKakao}
        >
            <KakaoIcon />
            카카오 로그인
        </button>
    );
};
