export const useKakaoLogin = () => {
    const loginWithKakao = () => {
        const Kakao = window.Kakao;

        if (!Kakao) {
            console.error("Kakao SDK not loaded");
            return;
        }

        if (!Kakao.isInitialized()) {
            Kakao.init(import.meta.env.VITE_KAKAO_JS_KEY);
        }

        Kakao.Auth.authorize({
            redirectUri: "http://localhost:5173/oauth/kakao",
        });
    };

    return { loginWithKakao };
};
