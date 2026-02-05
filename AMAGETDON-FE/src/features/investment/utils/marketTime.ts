/**
 * 한국 주식 장 운영 시간 관련 유틸리티
 * 장 운영 시간: 평일 09:00 ~ 15:30
 */

/**
 * 현재 장이 열려있는지 확인
 */
export const isMarketOpen = (): boolean => {
    const now = new Date();
    const day = now.getDay(); // 0: 일요일, 6: 토요일

    // 주말 체크
    if (day === 0 || day === 6) {
        return false;
    }

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes; // 분 단위로 변환

    const marketOpen = 9 * 60; // 09:00 = 540분
    const marketClose = 15 * 60 + 30; // 15:30 = 930분

    return currentTime >= marketOpen && currentTime < marketClose;
};

/**
 * 장 상태 텍스트 반환
 */
export const getMarketStatusText = (): string => {
    return isMarketOpen() ? '장 운영 중' : '장 마감';
};

/**
 * 장 상태에 따른 CSS 클래스 반환
 */
export const getMarketStatusClass = (): string => {
    return isMarketOpen() ? 'market-open' : 'market-closed';
};
