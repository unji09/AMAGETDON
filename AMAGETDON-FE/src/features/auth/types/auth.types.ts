export interface AuthLoginResponse {
    accessToken: string;
    tokenType: string;
    expiration: number;
    firstLogin: boolean;
}

export interface LoginRequest {
    email: string
    password: string
}

export interface SignupRequest {
    email: string
    password: string
    nickname: string
}
