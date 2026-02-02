import apiClient from "@/api/client.ts";
import type {LoginRequest, SignupRequest, AuthLoginResponse} from '../types/auth.types'

export const loginApi = (data: LoginRequest) =>
    apiClient.post<AuthLoginResponse>('/auth/login', data)

export const signupApi = (data: SignupRequest) =>
    apiClient.post<AuthLoginResponse>('/auth/signup', data)

export const logoutApi = () =>
    apiClient.post('/auth/logout')

export const withdrawApi = () =>
    apiClient.delete('/auth/withdraw')
