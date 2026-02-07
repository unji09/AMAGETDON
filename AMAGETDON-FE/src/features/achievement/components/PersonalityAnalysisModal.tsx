import { useState } from 'react';
import { Modal, Button } from '@/components/common';
import { INVESTMENT_TYPE_CONFIG } from '@/constants/investmentType';
import type { PersonalityAnalyzeResponse } from '@/api/achievementApi';
import './PersonalityAnalysisModal.css';

type InvestmentType = 'AGGRESSIVE' | 'NEUTRAL' | 'STABLE';

interface PersonalityAnalysisModalProps {
    isOpen: boolean;
    result: PersonalityAnalyzeResponse | null;
    onClose: () => void;
    onConfirm: (selectedType: InvestmentType) => void;
    loading?: boolean;
}

export const PersonalityAnalysisModal = ({
    isOpen,
    result,
    onClose,
    onConfirm,
    loading = false,
}: PersonalityAnalysisModalProps) => {
    const [selectedType, setSelectedType] = useState<InvestmentType | null>(null);

    if (!isOpen || !result) return null;

    const { initial_type, predicted_type, confidence, probabilities } = result;
    const isSameType = initial_type === predicted_type;

    const handleConfirm = () => {
        if (isSameType) {
            onClose();
        } else if (selectedType) {
            onConfirm(selectedType);
        }
    };

    const renderTypeCard = (type: InvestmentType, isSelected: boolean, onClick?: () => void) => {
        const config = INVESTMENT_TYPE_CONFIG[type];
        return (
            <div
                className={`personality-type-card ${isSelected ? 'personality-type-card--selected' : ''} ${onClick ? 'personality-type-card--clickable' : ''}`}
                onClick={onClick}
                style={{ '--type-color': config.color, '--type-bg': config.bgColor } as React.CSSProperties}
            >
                <span className="personality-type-card__icon">{config.icon}</span>
                <span className="personality-type-card__label">{config.label}</span>
                {probabilities && (
                    <span className="personality-type-card__prob">
                        {(probabilities[type] * 100).toFixed(1)}%
                    </span>
                )}
            </div>
        );
    };

    return (
        <Modal isOpen onClose={onClose}>
            <div className="personality-analysis">
                <h2 className="personality-analysis__title">
                    {isSameType ? '성향 분석 완료' : '새로운 성향이 발견되었어요!'}
                </h2>

                {isSameType ? (
                    // 같은 성향인 경우
                    <div className="personality-analysis__same">
                        <p className="personality-analysis__desc">
                            업적 분석 결과, 현재 성향과 동일한 성향이 추천되었습니다.
                        </p>
                        {predicted_type && (
                            <div className="personality-analysis__current">
                                {renderTypeCard(predicted_type, true)}
                            </div>
                        )}
                        {confidence && (
                            <p className="personality-analysis__confidence">
                                신뢰도: {(confidence * 100).toFixed(1)}%
                            </p>
                        )}
                        <div className="personality-analysis__actions">
                            <Button variant="primary" onClick={handleConfirm}>
                                확인
                            </Button>
                        </div>
                    </div>
                ) : (
                    // 다른 성향인 경우
                    <div className="personality-analysis__different">
                        <p className="personality-analysis__desc">
                            달성한 업적을 분석한 결과, 새로운 성향이 추천되었습니다.<br />
                            원하는 성향을 선택해주세요.
                        </p>

                        <div className="personality-analysis__comparison">
                            <div className="personality-analysis__column">
                                <span className="personality-analysis__label">현재 성향</span>
                                {initial_type && renderTypeCard(
                                    initial_type,
                                    selectedType === initial_type,
                                    () => setSelectedType(initial_type)
                                )}
                            </div>

                            <div className="personality-analysis__arrow">→</div>

                            <div className="personality-analysis__column">
                                <span className="personality-analysis__label">추천 성향</span>
                                {predicted_type && renderTypeCard(
                                    predicted_type,
                                    selectedType === predicted_type,
                                    () => setSelectedType(predicted_type)
                                )}
                            </div>
                        </div>

                        {confidence && (
                            <p className="personality-analysis__confidence">
                                분석 신뢰도: {(confidence * 100).toFixed(1)}%
                            </p>
                        )}

                        <div className="personality-analysis__actions">
                            <Button variant="secondary" onClick={onClose}>
                                나중에
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleConfirm}
                                disabled={!selectedType || loading}
                            >
                                {loading ? '적용 중...' : '선택 완료'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
