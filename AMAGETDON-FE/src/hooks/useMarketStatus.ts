import { useState, useEffect } from 'react';
import { isMarketOpen } from '@/features/investment/utils/marketTime';

/**
 * 장 운영 상태를 실시간으로 추적하는 훅
 * 1분마다 상태 업데이트
 */
export const useMarketStatus = () => {
    const [isOpen, setIsOpen] = useState(isMarketOpen);

    useEffect(() => {
        // 1분마다 장 상태 체크
        const interval = setInterval(() => {
            setIsOpen(isMarketOpen());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return {
        isOpen,
        statusText: isOpen ? '장 운영 중' : '장 마감',
        statusClass: isOpen ? 'market-open' : 'market-closed',
    };
};
