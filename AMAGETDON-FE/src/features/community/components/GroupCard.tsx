/**
 * GroupCard - 그룹 카드 컴포넌트
 * 공개 그룹 목록에서 각 그룹을 표시하는 카드
 */

import type { RoomResponse } from '../types/CommunityTypes';
import './GroupCard.css';

interface GroupCardProps {
    room: RoomResponse;
    onJoin: (roomId: number) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ room, onJoin }) => {
    const isFull = room.currentMemberCount >= room.maxMemberCount;

    const handleJoinClick = () => {
        if (!isFull) {
            onJoin(room.roomId);
        }
    };

    return (
        <div className={`group-card ${isFull ? 'group-card--full' : ''}`}>
            <div className="group-card__content">
                <h3 className="group-card__name">{room.name}</h3>
                <div className="group-card__members">
                    {room.currentMemberCount}/{room.maxMemberCount}
                </div>
            </div>
            <button
                className={`group-card__button ${isFull ? 'group-card__button--disabled' : ''}`}
                onClick={handleJoinClick}
                disabled={isFull}
            >
                {isFull ? '정원 마감' : '참여하기'}
            </button>
        </div>
    );
};

export default GroupCard;