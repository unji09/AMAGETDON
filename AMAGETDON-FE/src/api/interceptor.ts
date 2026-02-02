import { AxiosError } from 'axios'
import apiClient from "@/api/client.ts";


let isRefreshing = false
let failedQueue: (() => void)[] = []

const processQueue = () => {
    failedQueue.forEach(cb => cb())
    failedQueue = []
}

// 401 자동 처리 제외 경로
const AUTH_ENDPOINTS = ['/auth/login', '/auth/signup', '/auth/refresh']

const isAuthEndpoint = (url?: string) =>
    AUTH_ENDPOINTS.some(endpoint => url?.includes(endpoint))

apiClient.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
        const originalRequest: any = error.config

        // 로그인/회원가입 요청은 401 자동 처리 제외 (에러를 그대로 반환)
        if (isAuthEndpoint(originalRequest?.url)) {
            return Promise.reject(error)
        }

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
                await apiClient.post('/auth/refresh')
                processQueue()
                return apiClient(originalRequest)
            } catch (refreshError) {
                localStorage.removeItem('accessToken')
                window.location.href = '/login'
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)
