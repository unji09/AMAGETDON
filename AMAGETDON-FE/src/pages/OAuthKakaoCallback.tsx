import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { kakaoOAuthLogin } from "@/api/oauthApi.ts";

export default function OAuthKakaoCallback() {
    const navigate = useNavigate();
    const calledRef = useRef(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (!code) return;

        if (calledRef.current) return;
        calledRef.current = true;

        const handleKakaoLogin = async () => {
            try {
                const data = await kakaoOAuthLogin(code);

                // 토큰 저장
                if (data.accessToken) {
                    localStorage.setItem("accessToken", data.accessToken);
                }

                // 첫 로그인이면 설문조사로, 아니면 홈으로
                if (data.firstLogin) {
                    navigate("/survey", { replace: true });
                } else {
                    navigate("/", { replace: true });
                }
            } catch {
                alert("카카오 로그인에 실패했습니다.");
                navigate("/login", { replace: true });
            }
        };

        handleKakaoLogin();
    }, [navigate]);

    return (
        <div style={{ padding: "40px", textAlign: "center" }}>
            <h1>카카오 로그인 처리 중...</h1>
            <p>잠시만 기다려 주세요.</p>
        </div>
    );
}
