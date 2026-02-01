import apiClient from "@/api/client.ts";
import type {LoginRequest, SignupRequest} from '../types/auth.types'

export const loginApi = (data: LoginRequest) =>
    apiClient.post('/auth/login', data)

export const signupApi = (data: SignupRequest) =>
    apiClient.post('/auth/signup', data)
