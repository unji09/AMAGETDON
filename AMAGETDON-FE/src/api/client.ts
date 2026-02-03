/**
 * Axios 인스턴스 설정
 */

import axios from 'axios';
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { setCurrentUserInfo, clearCurrentUserInfo } from '@/utils/jwtUtils';


// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Axios 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request 인터셉터: 토큰 자동 추가
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// ✅ FIXED: Response 인터셉터 하나로 통합 (로그인 처리 + 에러 처리)
apiClient.interceptors.response.use(
    async (response) => {
        // ✅ 로그인/회원가입 성공 시 자동으로 사용자 정보 저장
        if (response.config.url?.includes('/login') ||
            response.config.url?.includes('/signup')) {
            const accessToken = response.data.accessToken;

            if (accessToken) {
                localStorage.setItem('accessToken', accessToken);
                console.log('✅ [apiClient] 로그인 성공 - 토큰 저장 완료');

                try {
                    // 사용자 정보 조회 및 저장
                    const userInfo = await apiClient.get('/users/me');
                    setCurrentUserInfo(userInfo.data.nickname, userInfo.data.email);
                    console.log('✅ [apiClient] 사용자 정보 저장 완료:', userInfo.data.nickname);
                } catch (error) {
                    console.error('❌ [apiClient] 사용자 정보 조회 실패:', error);
                }
            }
        }

        // ✅ 로그아웃 시 사용자 정보 삭제
        if (response.config.url?.includes('/logout')) {
            clearCurrentUserInfo();
            console.log('✅ [apiClient] 로그아웃 - 사용자 정보 삭제');
        }

        return response;
    },
    async (error: AxiosError) => {
        // 401 에러: 토큰 만료 또는 인증 실패
        if (error.response?.status === 401) {
            localStorage.removeItem('accessToken');
            clearCurrentUserInfo();
            window.location.href = '/login';
        }

        // 403 에러: 권한 없음
        if (error.response?.status === 403) {
            alert('접근 권한이 없습니다.');
        }

        // 500 에러: 서버 에러
        if (error.response?.status === 500) {
            alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }

        return Promise.reject(error);
    }
);

export default apiClient;