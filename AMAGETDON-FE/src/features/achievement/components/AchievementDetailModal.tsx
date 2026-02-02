import { useState } from 'react';
import { Modal, Button, Toast } from '@/components/common';
import { updateUserTitle } from '@/api/achievementApi';
import { CATEGORY_LABELS } from '../types/achievement';
import type { AchievementItem } from '../types/achievement';
import './AchievementDetailModal.css';

interface AchievementDetailModalProps {
    achievement: AchievementItem | null;
    currentTitle: string | null;
    onClose: () => void;
    /** 칭호 변경 성공 시 부모에 알림 */
    onTitleChanged: (newTitle: string) => void;
}

/**
 * 업적 상세 모달
 * - 달성 업적: 아이콘 + 달성 뱃지 + 이름 + 달성일 + 설명 + 칭호 설정 버튼
 * - 미달성 업적: 자물쇠 + 이름 + 카테고리 + 안내 문구
 */
export const AchievementDetailModal = ({
    achievement,
    currentTitle,
    onClose,
    onTitleChanged,
}: AchievementDetailModalProps) => {
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (!achievement) return null;

    const { achievementName, achievementCategory, achievementIcon, achievementContent, isAchieved, achievedAt } = achievement;

    const isCurrentTitle = currentTitle === achievementName;

    const formattedDate = achievedAt
        ? new Date(achievedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
        : null;

    /** 칭호 설정 핸들러 */
    const handleSetTitle = async () => {
        if (loading || isCurrentTitle) return;
        setLoading(true);
        try {
            await updateUserTitle(achievementName);
            onTitleChanged(achievementName);
            setToastMsg(`칭호가 "${achievementName}"(으)로 변경되었습니다.`);
        } catch {
            setToastMsg('칭호 변경에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal isOpen onClose={onClose}>
                <div className="achievement-detail">
                    {isAchieved ? (
                        /* ─── 달성 업적 ─── */
                        <>
                            <div className="achievement-detail__icon-wrap">
                                {achievementIcon ? (
                                    <img
                                        className="achievement-detail__icon"
                                        src={achievementIcon}
                                        alt={achievementName}
                                    />
                                ) : (
                                    <span className="achievement-detail__icon-placeholder">&#127942;</span>
                                )}
                            </div>
                            <span className="achievement-detail__badge">업적 달성 완료</span>
                            <h3 className="achievement-detail__name">{achievementName}</h3>
                            {formattedDate && (
                                <p className="achievement-detail__date">달성일: {formattedDate}</p>
                            )}
                            {achievementContent && (
                                <p className="achievement-detail__desc">{achievementContent}</p>
                            )}
                            <div className="achievement-detail__actions">
                                <Button
                                    variant="primary"
                                    size="medium"
                                    onClick={handleSetTitle}
                                    disabled={isCurrentTitle || loading}
                                >
                                    {isCurrentTitle ? '현재 칭호' : '칭호로 설정하기'}
                                </Button>
                            </div>
                        </>
                    ) : (
                        /* ─── 미달성 업적 ─── */
                        <>
                            <div className="achievement-detail__icon-wrap achievement-detail__icon-wrap--locked">
                                <span className="achievement-detail__lock">&#128274;</span>
                            </div>
                            <h3 className="achievement-detail__name">{achievementName}</h3>
                            <span className="achievement-detail__category-tag">
                                {CATEGORY_LABELS[achievementCategory]}
                            </span>
                            <p className="achievement-detail__locked-msg">
                                아직 달성하지 못한 업적입니다.
                            </p>
                        </>
                    )}
                </div>
            </Modal>

            {toastMsg && (
                <Toast
                    message={toastMsg}
                    type="success"
                    duration={3000}
                    onClose={() => setToastMsg(null)}
                />
            )}
        </>
    );
};
