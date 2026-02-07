/**
 * GroupCreateModal - 그룹 생성 모달
 * 공개/비밀 그룹 생성 기능
 *
 * ✅ [Fix] 참여 코드 보안 개선
 * - 기본: ****** 마스킹 상태
 * - 👁 눈 아이콘 클릭으로 토글
 * - 복사는 마스킹 상태에서도 가능
 */

import { useState, useEffect } from 'react';
import type { RoomCreateRequest } from '../types/CommunityTypes';
import './GroupCreateModal.css';

interface GroupCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: RoomCreateRequest) => Promise<void>;
}

const GroupCreateModal: React.FC<GroupCreateModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [maxMemberCount, setMaxMemberCount] = useState(50);
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [showCode, setShowCode] = useState(false); // ✅ 코드 표시/숨김 토글
    const [codeCopied, setCodeCopied] = useState(false); // ✅ 복사 완료 피드백

    // 참여코드 자동 생성 (비밀방일 경우)
    useEffect(() => {
        if (!isPublic && !joinCode) {
            const code = generateJoinCode();
            setJoinCode(code);
        }
    }, [isPublic, joinCode]);

    // 6자리 참여코드 생성 (영문 대문자 + 숫자)
    const generateJoinCode = (): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    // 입력 검증
    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (name.trim().length < 2) {
            newErrors.name = '그룹명은 최소 2자 이상이어야 합니다';
        } else if (name.trim().length > 50) {
            newErrors.name = '그룹명은 최대 50자까지 입력 가능합니다';
        }

        if (maxMemberCount < 2 || maxMemberCount > 100) {
            newErrors.maxMemberCount = '최대 인원은 2명 ~ 100명 사이여야 합니다';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 그룹 생성
    const handleCreate = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const requestData: RoomCreateRequest = {
                name: name.trim(),
                isPublic,
                maxMemberCount,
                ...(isPublic ? {} : { joinCode }),
            };

            await onCreate(requestData);
            handleClose();
        } catch (error) {
            console.error('그룹 생성 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    // 모달 닫기
    const handleClose = () => {
        setName('');
        setIsPublic(true);
        setMaxMemberCount(50);
        setJoinCode('');
        setErrors({});
        setLoading(false);
        setShowCode(false);
        setCodeCopied(false);
        onClose();
    };

    // ✅ 참여코드 복사 (마스킹 상태에서도 실제 코드 복사)
    const handleCopyCode = () => {
        navigator.clipboard.writeText(joinCode).then(() => {
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        }).catch(() => {
            // fallback: clipboard API 미지원 시
            alert('참여 코드: ' + joinCode);
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">새 그룹 만들기</h2>
                    <button className="modal-close" onClick={handleClose} type="button">
                        ✕
                    </button>
                </div>

                <div className="modal-body">
                    {/* 그룹명 입력 */}
                    <div className="form-group">
                        <label className="form-label">
                            그룹명 <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="예: 초보자 주식 투자방"
                            maxLength={50}
                            className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                        <div className="input-counter">{name.length} / 50</div>
                    </div>

                    {/* 공개 설정 */}
                    <div className="form-group">
                        <label className="form-label">
                            그룹 공개 설정 <span className="required">*</span>
                        </label>
                        <div className="radio-group">
                            <label className={`radio-option ${isPublic ? 'radio-option--public-active' : ''}`}>
                                <input
                                    type="radio"
                                    name="isPublic"
                                    checked={isPublic}
                                    onChange={() => setIsPublic(true)}
                                />
                                <div className="radio-content">
                                    <div className="radio-title">공개 그룹</div>
                                    <div className="radio-desc">누구나 검색하고 참여 가능</div>
                                </div>
                            </label>
                            <label className={`radio-option ${!isPublic ? 'radio-option--private-active' : ''}`}>
                                <input
                                    type="radio"
                                    name="isPublic"
                                    checked={!isPublic}
                                    onChange={() => setIsPublic(false)}
                                />
                                <div className="radio-content">
                                    <div className="radio-title">비밀 그룹</div>
                                    <div className="radio-desc">참여 코드로만 참여 가능</div>
                                </div>
                            </label>
                        </div>

                        {/* 선택된 그룹 타입 설명 박스 */}
                        {isPublic && (
                            <div className="group-type-info group-type-info--public">
                                <div className="info-title">✅ 공개 그룹</div>
                                <ul className="info-list">
                                    <li>• 그룹 목록에 바로 표시됩니다</li>
                                    <li>• 누구나 참여 가능합니다</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* 최대 인원 */}
                    <div className="form-group">
                        <label className="form-label">
                            최대 인원 <span className="required">*</span>
                        </label>
                        <div className="number-input-group">
                            <input
                                type="number"
                                value={maxMemberCount}
                                onChange={(e) => setMaxMemberCount(Number(e.target.value))}
                                min={2}
                                max={100}
                                className={`form-input ${errors.maxMemberCount ? 'form-input--error' : ''}`}
                            />
                            <span className="number-unit">명</span>
                        </div>
                        {errors.maxMemberCount && <span className="error-message">{errors.maxMemberCount}</span>}
                        <div className="input-help">2명 ~ 100명까지 설정 가능합니다</div>
                    </div>

                    {/* ✅ 참여 코드 (비밀방만) - 마스킹 + 토글 + 복사 */}
                    {!isPublic && (
                        <div className="form-group">
                            <label className="form-label">참여 코드</label>
                            <div className="code-section">
                                <div className="code-input-wrapper">
                                    <input
                                        type="text"
                                        value={showCode ? joinCode : '••••••'}
                                        readOnly
                                        className="code-input"
                                    />
                                    <button
                                        type="button"
                                        className="btn-icon"
                                        onClick={() => setShowCode(!showCode)}
                                        title={showCode ? '코드 숨기기' : '코드 보기'}
                                    >
                                        {showCode ? (
                                            /* 눈 열림 아이콘 (보이는 상태) */
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#96773D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        ) : (
                                            /* 눈 닫힘 아이콘 (숨긴 상태) */
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#96773D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                                <line x1="1" y1="1" x2="23" y2="23"/>
                                            </svg>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn-small ${codeCopied ? 'btn-small--copied' : ''}`}
                                        onClick={handleCopyCode}
                                    >
                                        {codeCopied ? '복사됨 ✓' : '복사'}
                                    </button>
                                </div>
                                <div className="code-info">
                                    <div className="code-info-title">🔒 비밀 그룹</div>
                                    <ul className="code-info-list">
                                        <li>• 참여 코드는 생성 시 자동으로 만들어집니다</li>
                                        <li>• 참여 코드를 공유한 사람만 참여할 수 있습니다</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 버튼 */}
                <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={handleClose} disabled={loading}>
                        취소
                    </button>
                    <button type="button" className="btn-primary" onClick={handleCreate} disabled={loading}>
                        {loading ? '생성 중...' : '그룹 생성하기'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupCreateModal;