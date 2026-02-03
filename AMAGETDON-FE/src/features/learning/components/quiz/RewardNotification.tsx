import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Coins } from 'lucide-react';
import './RewardNotification.css';

interface RewardNotificationProps {
    amount: number;
    currentBalance: number;
    onClose: () => void;
}

/**
 * 퀴즈 보상 알림 컴포넌트
 * - 정답 시 보상 금액 표시
 * - 3초 후 자동 사라짐
 * - 우측 상단 고정 위치
 */
export const RewardNotification = ({
                                       amount,
                                       currentBalance,
                                       onClose,
                                   }: RewardNotificationProps) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    // 금액 포맷팅 (천 단위 콤마)
    const formatAmount = (value: number): string => {
        return value.toLocaleString('ko-KR');
    };

    return createPortal(
        <div className="reward-notification">
            <div className="reward-notification__icon-wrap">
                <Coins size={24} className="reward-notification__icon" />
            </div>
            <div className="reward-notification__content">
                <div className="reward-notification__amount">
                    +{formatAmount(amount)}원
                </div>
                <div className="reward-notification__balance">
                    잔액: {formatAmount(currentBalance)}원
                </div>
            </div>
        </div>,
        document.body
    );
};