import { useState } from 'react';
import { Layout, ContainerContent } from '@/components/layout';
import GroupCard from '@/features/community/components/GroupCard';
import GroupCreateModal from '@/features/community/components/GroupCreateModal';
import type { RoomResponse, RoomCreateRequest } from '@/features/community/types/CommunityTypes';

export const CommunityPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 테스트용 더미 데이터
    const testRooms: RoomResponse[] = [
        {
            roomId: 1,
            name: '초보 투자자 모임',
            currentMemberCount: 5,
            maxMemberCount: 10,
            isPublic: true,
            createdAt: '2026-02-02T10:00:00',
        },
        {
            roomId: 2,
            name: '주식 고수들의 방',
            currentMemberCount: 10,
            maxMemberCount: 10,
            isPublic: true,
            createdAt: '2026-02-02T11:00:00',
        },
        {
            roomId: 3,
            name: '코인 투자 스터디',
            currentMemberCount: 7,
            maxMemberCount: 15,
            isPublic: true,
            createdAt: '2026-02-02T12:00:00',
        },
    ];

    const handleJoin = (roomId: number) => {
        console.log(`방 ${roomId}에 참여하기 클릭!`);
        alert(`방 ${roomId}에 참여 요청!`);
    };

    const handleCreateRoom = async (data: RoomCreateRequest) => {
        console.log('그룹 생성 데이터:', data);
        alert(`그룹 생성 완료!\n이름: ${data.name}\n인원: ${data.maxMemberCount}명\n공개: ${data.isPublic ? '공개' : '비밀'}\n${!data.isPublic ? '참여코드: ' + data.joinCode : ''}`);
    };

    return (
        <Layout>
            <ContainerContent>
                <div style={{ padding: '40px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h1 style={{ fontSize: '28px', margin: 0 }}>
                            커뮤니티
                        </h1>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            style={{
                                padding: '12px 24px',
                                background: '#203C2E',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                            }}
                        >
                            그룹 생성하기
                        </button>
                    </div>

                    <div>
                        {testRooms.map((room) => (
                            <GroupCard key={room.roomId} room={room} onJoin={handleJoin} />
                        ))}
                    </div>

                </div>
            </ContainerContent>

            {/* 모달 */}
            <GroupCreateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreateRoom}
            />
        </Layout>
    );
};