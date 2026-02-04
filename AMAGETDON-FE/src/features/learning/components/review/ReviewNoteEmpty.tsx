import { BookOpen } from 'lucide-react';
import { Button } from '@/components/common';
import { useNavigate } from 'react-router-dom';
import './ReviewNoteEmpty.css';

/**
 * 오답노트 빈 상태 컴포넌트
 * - 오답이 없을 때 표시
 * - 학습 시작 버튼
 */
export const ReviewNoteEmpty = () => {
    const navigate = useNavigate();

    return (
        <div className="review-note-empty">
            <div className="review-note-empty__icon">
                <BookOpen size={48} strokeWidth={1.5} />
            </div>
            <h2 className="review-note-empty__title">오답이 없습니다!</h2>
            <p className="review-note-empty__message">
                퀴즈를 풀고 틀린 문제는 자동으로 오답노트에 추가됩니다.
            </p>
            <Button
                variant="primary"
                size="medium"
                onClick={() => navigate('/learning')}
            >
                학습 시작하기
            </Button>
        </div>
    );
};