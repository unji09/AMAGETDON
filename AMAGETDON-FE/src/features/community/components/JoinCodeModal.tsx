/**
 * JoinCodeModal - 참여코드 입력 모달
 * 비밀 그룹 참여 기능
 */

import { useState } from 'react';
import type { MemberResponse } from '../types/CommunityTypes';
import './JoinCodeModal.css';

interface JoinCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJoin: (joinCode: string) => Promise<MemberResponse>;
}

const JoinCodeModal: React.FC<JoinCodeModalProps> = ({ isOpen, onClose, onJoin }) => {
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 입력값을 대문자로 변환하고 영문+숫자만 허용
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length <= 6) {
            setJoinCode(value);
            setError('');
        }
    };

    // 입력 검증
    const validate = (): boolean => {
        if (joinCode.length !== 6) {
            setError('참여 코드는 6자리여야 합니다 (영문 대문자, 숫자)');
            return false;
        }
        return true;
    };

    // 그룹 참여
    const handleJoin = async () => {
        if (!validate()) return;

        setLoading(true);
        setError('');

        try {
            await onJoin(joinCode);
            handleClose();
        } catch (err: unknown) {
            // API 에러 메시지 처리
            let errorMessage = '그룹 참여에 실패했습니다';

            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === 'object' && err !== null && 'response' in err) {
                const response = (err as { response?: { data?: { message?: string } } }).response;
                if (response?.data?.message) {
                    errorMessage = response.data.message;
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // 모달 닫기
    const handleClose = () => {
        setJoinCode('');
        setError('');
        setLoading(false);
        onClose();
    };

    // Enter 키 처리
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            handleJoin();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="join-code-modal-overlay">
            <div className="join-code-modal-content">
                <div className="join-code-modal-header">
                    <h2 className="join-code-modal-title">참여 코드 입력</h2>
                    <button className="join-code-modal-close" onClick={handleClose} type="button">
                        ✕
                    </button>
                </div>

                <div className="join-code-modal-body">
                    <p className="join-code-modal-description">
                        비밀 그룹에 참여하려면 6자리 코드가 필요합니다
                    </p>

                    {/* 참여코드 입력 */}
                    <div className="join-code-input-container">
                        <input
                            type="text"
                            value={joinCode}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder="ABC123"
                            maxLength={6}
                            className={`join-code-input ${error ? 'join-code-input--error' : ''}`}
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    {/* 에러 메시지 */}
                    {error && <div className="join-code-error-message">✕ {error}</div>}

                    {/* 안내 문구 */}
                    <div className="join-code-help-text">
                        🔒 그룹 생성자에게 받은 6자리 코드를 입력하세요 (영문 대문자 + 숫자)
                    </div>
                </div>

                {/* 버튼 */}
                <div className="join-code-modal-footer">
                    <button
                        type="button"
                        className="join-code-btn-primary"
                        onClick={handleJoin}
                        disabled={loading || joinCode.length !== 6}
                    >
                        {loading ? '참여 중...' : '참여하기'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JoinCodeModal;