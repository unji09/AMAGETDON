import { useId } from 'react';
import './Input.css';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

/**
 * 공통 입력 필드 컴포넌트
 */
export const Input = ({
                          label,
                          error,
                          fullWidth = false,
                          className = '',
                          id,
                          ...props
                      }: InputProps) => {
    // React 18의 useId 훅 사용
    const generatedId = useId();
    const inputId = id || generatedId;

    const classNames = [
        'input-wrapper',
        fullWidth && 'input-full-width',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classNames}>
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={`input ${error ? 'input-error' : ''}`}
                aria-invalid={!!error}
                aria-describedby={error ? `${inputId}-error` : undefined}
                {...props}
            />
            {error && (
                <span id={`${inputId}-error`} className="input-error-message" role="alert">
          {error}
        </span>
            )}
        </div>
    );
};