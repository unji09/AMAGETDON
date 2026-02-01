import apiClient from "@/api/client.ts";

export const getMyInfo = () => apiClient.get('/users/me')
export const updateMyInfo = (nickname: string) =>
    apiClient.put('/users/me', { nickname })
