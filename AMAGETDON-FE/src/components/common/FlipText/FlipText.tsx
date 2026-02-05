import { useEffect, useState, useRef, memo } from 'react';
import './FlipText.css';

interface FlipTextProps {
    value: string | number;
    className?: string;
}

/**
 * 값이 변경될 때 위로 슬라이드되며 바뀌는 텍스트 컴포넌트
 */
export const FlipText = memo(({
    value,
    className = '',
}: FlipTextProps) => {
    const [displayValue, setDisplayValue] = useState(String(value));
    const [prevValue, setPrevValue] = useState<string | null>(null);
    const [animationKey, setAnimationKey] = useState(0);
    const isFirstRender = useRef(true);

    useEffect(() => {
        const newValue = String(value);

        // 첫 렌더링이면 값만 설정하고 애니메이션 없음
        if (isFirstRender.current) {
            isFirstRender.current = false;
            setDisplayValue(newValue);
            return;
        }

        // 값이 변경되면 애니메이션 트리거
        if (newValue !== displayValue) {
            setPrevValue(displayValue);
            setDisplayValue(newValue);
            setAnimationKey(k => k + 1);
        }
    }, [value]); // displayValue를 의존성에서 제거

    // 애니메이션 종료 후 prevValue 정리
    useEffect(() => {
        if (prevValue !== null) {
            const timer = setTimeout(() => {
                setPrevValue(null);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [animationKey]);

    const isAnimating = prevValue !== null;

    return (
        <span className={`flip-text ${className}`}>
            <span className="flip-text__container">
                {/* 이전 값 (위로 사라짐) */}
                {isAnimating && (
                    <span
                        key={`out-${animationKey}`}
                        className="flip-text__value flip-text__value--out"
                        aria-hidden="true"
                    >
                        {prevValue}
                    </span>
                )}

                {/* 현재 값 */}
                <span
                    key={`in-${animationKey}`}
                    className={`flip-text__value ${isAnimating ? 'flip-text__value--in' : ''}`}
                >
                    {displayValue}
                </span>
            </span>
        </span>
    );
});

FlipText.displayName = 'FlipText';
