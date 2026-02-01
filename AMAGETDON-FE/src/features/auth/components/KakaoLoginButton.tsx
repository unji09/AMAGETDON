import { useKakaoLogin } from "../hooks/useKakaoLogin";

export const KakaoLoginButton = () => {
    const { loginWithKakao } = useKakaoLogin();

    return (
        <button onClick={loginWithKakao}>
            카카오 로그인
        </button>
    );
};
