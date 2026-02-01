import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Toast.css';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    onClose: () => void;
}

/**
 * Toast 알림 컴포넌트
 */
export const Toast = ({
                          message,
                          type = 'info',
                          duration = 3000,
                          onClose
                      }: ToastProps) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    };

    return createPortal(
        <div className={`toast toast-${type}`}>
            <span className="toast-icon">{icons[type]}</span>
            <span className="toast-message">{message}</span>
        </div>,
        document.body
    );
};