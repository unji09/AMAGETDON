import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    loading?: boolean;
    children: React.ReactNode;
}

/**
 * 공통 버튼 컴포넌트
 */
export const Button = ({
                           variant = 'primary',
                           size = 'medium',
                           fullWidth = false,
                           loading = false,
                           disabled,
                           children,
                           className = '',
                           ...props
                       }: ButtonProps) => {
    const classNames = [
        'button',
        `button-${variant}`,
        `button-${size}`,
        fullWidth && 'button-full-width',
        loading && 'button-loading',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button
            className={classNames}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <>
                    <span className="button-spinner" />
                    <span>로딩 중...</span>
                </>
            ) : (
                children
            )}
        </button>
    );
};