export const kakaoOAuthLogin = async (
    code: string
) => {
    const response = await fetch(
        "/api/v1/oauth/kakao/login",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                provider: "KAKAO",
                code,
            }),
        }
    );

    if (!response.ok) {
        throw new Error("OAuth 로그인 실패");
    }

    return response.json();
};

