/**
 * JWT 토큰 디코딩 유틸리티
 * localStorage에서 accessToken을 가져와 사용자 정보 추출
 */

interface JwtPayload {
    userId: number;
    email: string;
    nickname?: string;
    iat: number;
    exp: number;
}

/**
 * JWT 토큰 디코딩
 * @param token JWT 토큰 문자열
 * @returns 디코딩된 payload 또는 null
 */
export const decodeJwt = (token: string): JwtPayload | null => {
    try {
        // Bearer 제거
        const cleanToken = token.replace('Bearer ', '');

        // JWT는 header.payload.signature 형식
        const parts = cleanToken.split('.');
        if (parts.length !== 3) {
            console.error('Invalid JWT format');
            return null;
        }

        // payload 디코딩 (Base64)
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));

        return JSON.parse(decoded) as JwtPayload;
    } catch (error) {
        console.error('JWT 디코딩 실패:', error);
        return null;
    }
};

/**
 * localStorage에서 현재 사용자 정보 가져오기
 * @returns 사용자 정보 또는 null
 */
export const getCurrentUser = (): { userId: number; nickname: string; email: string } | null => {
    try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.error('토큰이 없습니다.');
            return null;
        }

        const payload = decodeJwt(token);
        if (!payload) {
            return null;
        }

        return {
            userId: payload.userId,
            nickname: payload.nickname || payload.email.split('@')[0], // 닉네임 없으면 이메일 앞부분 사용
            email: payload.email,
        };
    } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
        return null;
    }
};

/**
 * 현재 사용자의 닉네임만 가져오기
 * @returns 닉네임 또는 '알 수 없음'
 */
export const getCurrentUserNickname = (): string => {
    const user = getCurrentUser();
    return user?.nickname || '알 수 없음';
};

/**
 * 현재 사용자의 ID만 가져오기
 * @returns 사용자 ID 또는 null
 */
export const getCurrentUserId = (): number | null => {
    const user = getCurrentUser();
    return user?.userId || null;
};