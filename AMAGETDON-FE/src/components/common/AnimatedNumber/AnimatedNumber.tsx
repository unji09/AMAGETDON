import { useEffect, useRef, useState, memo } from 'react';
import './AnimatedNumber.css';

interface AnimatedNumberProps {
    value: number;
    formatter?: (value: number) => string;
    duration?: number;
    className?: string;
    highlightChange?: boolean;
}

/**
 * 숫자가 변경될 때 애니메이션 효과를 보여주는 컴포넌트
 * - 슬롯머신처럼 위/아래로 굴러가는 효과
 * - 값이 증가하면 초록색, 감소하면 빨간색으로 하이라이트
 */
export const AnimatedNumber = memo(({
    value,
    formatter = (v) => v.toLocaleString(),
    duration = 300,
    className = '',
    highlightChange = true,
}: AnimatedNumberProps) => {
    const [displayValue, setDisplayValue] = useState(value);
    const [prevValue, setPrevValue] = useState(value);
    const [isAnimating, setIsAnimating] = useState(false);
    const [direction, setDirection] = useState<'up' | 'down' | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (value !== prevValue) {
            setDirection(value > prevValue ? 'up' : 'down');
            setIsAnimating(true);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                setDisplayValue(value);
                setPrevValue(value);
            }, duration / 2);

            setTimeout(() => {
                setIsAnimating(false);
                setDirection(null);
            }, duration);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [value, prevValue, duration]);

    const highlightClass = highlightChange && direction
        ? direction === 'up'
            ? 'animated-number--highlight-up'
            : 'animated-number--highlight-down'
        : '';

    return (
        <span
            className={`animated-number ${isAnimating ? 'animated-number--animating' : ''} ${highlightClass} ${className}`}
            style={{ '--animation-duration': `${duration}ms` } as React.CSSProperties}
        >
            <span className={`animated-number__value ${isAnimating ? `animated-number__value--${direction}` : ''}`}>
                {formatter(displayValue)}
            </span>
        </span>
    );
});

AnimatedNumber.displayName = 'AnimatedNumber';
