export interface AuthLoginResponse {
    accessToken: string;
    tokenType: string;
    expiration: number;
    firstLogin: boolean;
}
