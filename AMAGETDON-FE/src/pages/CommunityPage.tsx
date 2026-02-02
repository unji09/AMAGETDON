import { Layout, ContainerContent } from '@/components/layout';
import GroupCard from '@/features/community/components/GroupCard';
import type { RoomResponse } from '@/features/community/types/CommunityTypes';

export const CommunityPage = () => {
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

    return (
        <Layout>
            <ContainerContent>
                <div style={{ padding: '40px 0' }}>
                    <h1 style={{ fontSize: '28px', marginBottom: '24px' }}>
                        커뮤니티
                    </h1>

                    <div>
                        {testRooms.map((room) => (
                            <GroupCard key={room.roomId} room={room} onJoin={handleJoin} />
                        ))}
                    </div>
                </div>
            </ContainerContent>
        </Layout>
    );
};