import { useEffect, useRef } from "react";
import { kakaoOAuthLogin } from "@/features/auth/api/oauthApi"; // 네가 만든 API 함수

export default function OAuthKakaoCallback() {
    const calledRef = useRef(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (!code) return;

        if (calledRef.current) return;
        calledRef.current = true;

        kakaoOAuthLogin(code);
    }, []);

    return (
        <div style={{ padding: "40px" }}>
            <h1>카카오 로그인 처리 중...</h1>
            <p>잠시만 기다려 주세요.</p>
        </div>
    );
}
