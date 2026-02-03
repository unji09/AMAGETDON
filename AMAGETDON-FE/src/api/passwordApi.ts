import apiClient from "@/api/client.ts";

export const requestPasswordReset = (email: string) =>
    apiClient.post('/users/password/email', { email })
