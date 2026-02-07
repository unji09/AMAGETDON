import { useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';
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

    const { initial_type, predicted_type, _confidence, probabilities } = result;
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
                {isSelected && (
                    <div className="personality-type-card__check">
                        <Check size={14} />
                    </div>
                )}
                <span className="personality-type-card__icon">{config.icon}</span>
                <span className="personality-type-card__label">{config.label}</span>
                {probabilities && (
                    <span className="personality-type-card__prob">
                        {(probabilities[type] * 100).toFixed(0)}%
                    </span>
                )}
            </div>
        );
    };

    const CONFETTI_COUNT = 20;

    return (
        <Modal isOpen onClose={onClose}>
            <div className="personality-analysis">
                {/* 빵빠레 효과 */}
                <div className="personality-analysis__confetti" aria-hidden="true">
                    {Array.from({ length: CONFETTI_COUNT }, (_, i) => (
                        <span key={i} className="personality-analysis__particle" />
                    ))}
                </div>

                <h2 className="personality-analysis__title">
                    {isSameType ? '성향 분석 완료' : '새로운 성향 발견'}
                </h2>

                {isSameType ? (
                    <div className="personality-analysis__same">
                        <p className="personality-analysis__desc">
                            업적 분석 결과, 현재 성향이 가장 적합해요.
                        </p>
                        {predicted_type && (
                            <div className="personality-analysis__current">
                                {renderTypeCard(predicted_type, true)}
                            </div>
                        )}
                        <div className="personality-analysis__actions">
                            <Button variant="primary" onClick={handleConfirm}>
                                확인
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="personality-analysis__different">
                        <p className="personality-analysis__desc">
                            새로운 성향이 추천되었어요. 변경할 성향을 선택해주세요.
                        </p>

                        <div className="personality-analysis__comparison">
                            <div className="personality-analysis__column">
                                <span className="personality-analysis__label">현재</span>
                                {initial_type && renderTypeCard(
                                    initial_type,
                                    selectedType === initial_type,
                                    () => setSelectedType(initial_type)
                                )}
                            </div>

                            <ChevronRight size={20} className="personality-analysis__arrow" />

                            <div className="personality-analysis__column">
                                <span className="personality-analysis__label">추천</span>
                                {predicted_type && renderTypeCard(
                                    predicted_type,
                                    selectedType === predicted_type,
                                    () => setSelectedType(predicted_type)
                                )}
                            </div>
                        </div>

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
