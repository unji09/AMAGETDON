import { AxiosError } from 'axios'
import apiClient from "@/api/client.ts";


let isRefreshing = false
let failedQueue: (() => void)[] = []

const processQueue = () => {
    failedQueue.forEach(cb => cb())
    failedQueue = []
}

apiClient.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
        const originalRequest: any = error.config

        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true

            if (isRefreshing) {
                return new Promise(resolve => {
                    failedQueue.push(() => resolve(apiClient(originalRequest)))
                })
            }

            isRefreshing = true

            try {
                await apiClient.post('/api/v1/auth/refresh')
                processQueue()
                return apiClient(originalRequest)
            } catch (refreshError) {
                // 🔥 refreshToken도 만료됨
                window.location.href = '/login'
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)
