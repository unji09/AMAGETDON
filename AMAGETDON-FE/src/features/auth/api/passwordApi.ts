import apiClient from "@/api/client.ts";

export const requestPasswordReset = (email: string) =>
    apiClient.post('/auth/password/reset-request', { email })

export const resetPassword = (token: string, password: string) =>
    apiClient.post('/auth/password/reset', { token, password })
