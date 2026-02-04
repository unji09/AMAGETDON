import { useEffect, useState, useRef, memo } from 'react';
import './FlipText.css';

interface FlipTextProps {
    value: string | number;
    className?: string;
    highlightUp?: boolean;
    highlightDown?: boolean;
}

/**
 * 값이 변경될 때 부드럽게 슬라이드되며 바뀌는 텍스트 컴포넌트
 * 이전 값은 위/아래로 사라지고, 새 값은 반대 방향에서 나타남
 */
export const FlipText = memo(({
    value,
    className = '',
    highlightUp = false,
    highlightDown = false,
}: FlipTextProps) => {
    const [displayValue, setDisplayValue] = useState(String(value));
    const [prevValue, setPrevValue] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [direction, setDirection] = useState<'up' | 'down'>('up');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const newValue = String(value);

        if (newValue !== displayValue && !isAnimating) {
            // 방향 결정: 숫자면 크기 비교, 아니면 up으로 기본
            const numNew = parseFloat(newValue.replace(/[^0-9.-]/g, ''));
            const numOld = parseFloat(displayValue.replace(/[^0-9.-]/g, ''));

            if (!isNaN(numNew) && !isNaN(numOld)) {
                setDirection(numNew > numOld ? 'up' : 'down');
            } else {
                setDirection('up');
            }

            setPrevValue(displayValue);
            setDisplayValue(newValue);
            setIsAnimating(true);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                setPrevValue(null);
                setIsAnimating(false);
            }, 350);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [value, displayValue, isAnimating]);

    const highlightClass = highlightUp
        ? 'flip-text--highlight-up'
        : highlightDown
            ? 'flip-text--highlight-down'
            : '';

    return (
        <span className={`flip-text ${highlightClass} ${className}`}>
            <span className="flip-text__container">
                {/* 이전 값 (사라지는 중) */}
                {isAnimating && prevValue !== null && (
                    <span
                        className={`flip-text__value flip-text__value--out flip-text__value--${direction}`}
                        aria-hidden="true"
                    >
                        {prevValue}
                    </span>
                )}

                {/* 현재 값 */}
                <span
                    className={`flip-text__value ${isAnimating ? `flip-text__value--in flip-text__value--${direction}` : ''}`}
                >
                    {displayValue}
                </span>
            </span>
        </span>
    );
});

FlipText.displayName = 'FlipText';
