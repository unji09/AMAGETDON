import { useEffect, useState, memo, type ReactNode } from 'react';
import './AnimatedCell.css';

interface AnimatedCellProps {
    children: ReactNode;
    value: string | number;
    className?: string;
    highlightUp?: boolean;
    highlightDown?: boolean;
}

/**
 * 값이 변경될 때 반짝이는 효과를 보여주는 셀 컴포넌트
 */
export const AnimatedCell = memo(({
    children,
    value,
    className = '',
    highlightUp = false,
    highlightDown = false,
}: AnimatedCellProps) => {
    const [isFlashing, setIsFlashing] = useState(false);
    const [prevValue, setPrevValue] = useState(value);

    useEffect(() => {
        if (value !== prevValue) {
            setIsFlashing(true);
            setPrevValue(value);

            const timer = setTimeout(() => {
                setIsFlashing(false);
            }, 600);

            return () => clearTimeout(timer);
        }
    }, [value, prevValue]);

    const flashClass = isFlashing
        ? highlightUp
            ? 'animated-cell--flash-up'
            : highlightDown
                ? 'animated-cell--flash-down'
                : 'animated-cell--flash'
        : '';

    return (
        <span className={`animated-cell ${flashClass} ${className}`}>
            {children}
        </span>
    );
});

AnimatedCell.displayName = 'AnimatedCell';
