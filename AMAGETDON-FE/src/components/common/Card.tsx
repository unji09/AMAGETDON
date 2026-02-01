import './Card.css';

interface CardProps {
    children: React.ReactNode;
    padding?: 'small' | 'medium' | 'large';
    hoverable?: boolean;
    className?: string;
    onClick?: () => void;
}

/**
 * 공통 카드 컴포넌트
 */
export const Card = ({
                         children,
                         padding = 'medium',
                         hoverable = false,
                         className = '',
                         onClick,
                     }: CardProps) => {
    const classNames = [
        'card',
        `card-padding-${padding}`,
        hoverable && 'card-hoverable',
        onClick && 'card-clickable',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classNames} onClick={onClick}>
            {children}
        </div>
    );
};