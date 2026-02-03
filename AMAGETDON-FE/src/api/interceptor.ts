import { AxiosError } from 'axios'
import apiClient from '@/api/client'

interface RefreshResponse {
    accessToken: string
    tokenType: string
    expiration: number
    firstLogin: boolean
}

let isRefreshing = false
let failedQueue: {
    resolve: (value: unknown) => void
    reject: (error: unknown) => void
}[] = []

const processQueue = (error: unknown = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error)
        } else {
            resolve(undefined)
        }
    })
    failedQueue = []
}

// 401 자동 처리 제외 경로
const AUTH_ENDPOINTS = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/logout']

const isAuthEndpoint = (url?: string) =>
    AUTH_ENDPOINTS.some(endpoint => url?.includes(endpoint))

// 로그아웃 처리 (토큰 삭제 + 백엔드 쿠키 삭제 요청)
const handleLogout = async () => {
    localStorage.removeItem('accessToken')
    try {
        await apiClient.post('/auth/logout')
    } catch {
        // 로그아웃 API 실패해도 무시 (이미 세션 무효)
    }
    window.location.href = '/login'
}

console.log('[Interceptor] 등록됨')

apiClient.interceptors.response.use(
    response => {
        console.log('[Interceptor] 응답 성공:', response.config.url, response.status)
        return response
    },
    async (error: AxiosError) => {
        console.log('[Interceptor] 응답 에러:', error.config?.url, error.response?.status)
        const originalRequest = error.config as typeof error.config & { _retry?: boolean }

        // 로그인/회원가입/토큰갱신/로그아웃 요청은 401 자동 처리 제외
        if (isAuthEndpoint(originalRequest?.url)) {
            return Promise.reject(error)
        }

        if (error.response?.status === 401 && !originalRequest?._retry) {
            console.log('[Interceptor] 401 감지, refresh 시도...', originalRequest?.url)
            originalRequest._retry = true

            // 이미 갱신 중이면 큐에 추가
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then(() => apiClient(originalRequest))
            }

            isRefreshing = true

            try {
                // RefreshToken은 HttpOnly 쿠키로 자동 전송 (withCredentials: true)
                console.log('[Interceptor] /auth/refresh 호출 시작')
                const response = await apiClient.post<RefreshResponse>('/auth/refresh')
                console.log('[Interceptor] refresh 성공:', response.data)

                // 새 AccessToken 저장
                const { accessToken } = response.data
                localStorage.setItem('accessToken', accessToken)

                // 대기 중인 요청들 처리
                processQueue()

                // 원래 요청 재시도 (새 토큰으로)
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`
                }
                return apiClient(originalRequest)

            } catch (refreshError) {
                console.log('[Interceptor] refresh 실패:', refreshError)
                // 갱신 실패 시 대기 중인 요청들도 reject
                processQueue(refreshError)
                // 로그아웃 처리
                await handleLogout()
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)
