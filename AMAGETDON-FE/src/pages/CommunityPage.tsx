import { useState } from 'react';
import { Layout, ContainerContent } from '@/components/layout';
import GroupCard from '@/features/community/components/GroupCard';
import GroupCreateModal from '@/features/community/components/GroupCreateModal';
import JoinCodeModal from '@/features/community/components/JoinCodeModal';
import type {
    RoomResponse,
    RoomCreateRequest,
    MemberResponse
} from '@/features/community/types/CommunityTypes';

export const CommunityPage = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

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

    const handleJoinPrivate = async (joinCode: string): Promise<MemberResponse> => {
        console.log('참여코드로 그룹 참여:', joinCode);

        // const response = await joinPrivateRoom(joinCode);
        // return response;

        // 테스트용 더미 응답
        return new Promise((resolve) => {
            setTimeout(() => {
                alert(`참여코드 ${joinCode}로 그룹 참여 성공!`);
                resolve({
                    memberId: 999,
                    roomId: 99,
                    userId: 123,
                    isActive: true,
                });
            }, 1000);
        });
    };

    const handleCreateRoom = async (data: RoomCreateRequest) => {
        console.log('그룹 생성 데이터:', data);
        alert(
            `그룹 생성 완료!\n이름: ${data.name}\n인원: ${data.maxMemberCount}명\n공개: ${
                data.isPublic ? '공개' : '비밀'
            }\n${!data.isPublic ? '참여코드: ' + data.joinCode : ''}`
        );
    };

    return (
        <Layout>
            <ContainerContent>
                <div style={{ padding: '40px 0' }}>
                    {/* 헤더 */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px',
                        }}
                    >
                        <h1 style={{ fontSize: '28px', margin: 0 }}>커뮤니티</h1>

                        {/* 버튼 그룹 */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setIsJoinModalOpen(true)}
                                style={{
                                    padding: '12px 24px',
                                    background: '#FFFFFF',
                                    color: '#203C2E',
                                    border: '2px solid #203C2E',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#F8F8F8';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#FFFFFF';
                                }}
                            >
                                참여코드 입력
                            </button>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                style={{
                                    padding: '12px 24px',
                                    background: '#203C2E',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#162B20';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#203C2E';
                                }}
                            >
                                그룹 생성하기
                            </button>
                        </div>
                    </div>

                    {/* 그룹 목록 */}
                    <div>
                        {testRooms.map((room) => (
                            <GroupCard key={room.roomId} room={room} onJoin={handleJoin} />
                        ))}
                    </div>
                </div>
            </ContainerContent>

            {/* 그룹 생성 모달 */}
            <GroupCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateRoom}
            />

            {/* 참여코드 입력 모달 */}
            <JoinCodeModal
                isOpen={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
                onJoin={handleJoinPrivate}
            />
        </Layout>
    );
};