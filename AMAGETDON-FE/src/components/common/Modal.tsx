import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import './Modal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    /** overflow: visible 허용 (확대 기능 등에 사용) */
    allowOverflow?: boolean;
    /** 배경 클릭 및 ESC 키로 모달 닫기 방지 */
    preventOverlayClose?: boolean;
}

/**
 * 모달 컴포넌트
 */
export const Modal = ({ isOpen, onClose, children, title, allowOverflow = false, preventOverlayClose = false }: ModalProps) => {
    // ESC 키로 닫기
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !preventOverlayClose) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" onClick={preventOverlayClose ? undefined : onClose}>
            <div
                className={`modal-content ${allowOverflow ? 'modal-content--overflow' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="modal-header">
                    {title && <h2 className="modal-title">{title}</h2>}
                    <button
                        className="modal-close"
                        onClick={onClose}
                        aria-label="닫기"
                    >
                        ✕
                    </button>
                </div>

                {/* 본문 */}
                <div className={`modal-body ${allowOverflow ? 'modal-body--overflow' : ''}`}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};