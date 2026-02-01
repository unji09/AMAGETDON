/**
 * 공통 타입 정의
 */

// API 에러 응답
export interface ApiError {
    message: string;
    code?: string;
    status?: number;
}

// 페이지네이션 파라미터
export interface PaginationParams {
    page?: number;
    size?: number;
}

// 페이지네이션 정보
export interface PaginationInfo {
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

// API 공통 응답 래퍼
export interface ApiResponse<T> {
    data: T;
}