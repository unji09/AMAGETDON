export {};

declare global {
    interface Window {
        Kakao: KakaoSDK;
    }
}

interface KakaoSDK {
    Auth: {
        login(options: {
            scope?: string;
            success: (authObj: KakaoAuthResponse) => void;
            fail?: (err: unknown) => void;
        }): void;

        authorize(options: {
            redirectUri: string;
            scope?: string;
            state?: string;
        }): void;
    };

    isInitialized(): boolean;
    init(key: string): void;
}

interface KakaoAuthResponse {
    access_token: string;
}
