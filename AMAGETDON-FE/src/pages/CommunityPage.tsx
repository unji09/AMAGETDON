/**
 * 커뮤니티 페이지
 * 그룹 목록 조회, 생성, 참여 기능 (실제 API 연동)
 */

import { useState, useEffect } from 'react';
import { Layout, ContainerContent } from '@/components/layout';
import GroupCard from '@/features/community/components/GroupCard';
import GroupCreateModal from '@/features/community/components/GroupCreateModal';
import JoinCodeModal from '@/features/community/components/JoinCodeModal';
import {
    getPublicRooms,
    getMyRoom,
    createRoom,
    joinPublicRoom,
    joinPrivateRoom
} from '@/api/communityApi';
import type {
    RoomResponse,
    RoomCreateRequest,
    MemberResponse
} from '@/features/community/types/CommunityTypes';

export const CommunityPage = () => {
    // 상태 관리
    const [rooms, setRooms] = useState<RoomResponse[]>([]);
    const [myRoom, setMyRoom] = useState<RoomResponse | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // 초기 데이터 로드
    useEffect(() => {
        loadData();
    }, []);

    // 데이터 로드
    const loadData = async () => {
        try {
            setLoading(true);
            const [roomsData, myRoomData] = await Promise.all([
                getPublicRooms(),
                getMyRoom(),
            ]);
            setRooms(roomsData.rooms);
            setMyRoom(myRoomData);
        } catch (error) {
            console.error('데이터 로드 실패:', error);
            showToast('데이터를 불러오는데 실패했습니다', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 검색
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            // 검색어 없으면 전체 목록 다시 로드
            loadData();
            return;
        }

        try {
            setLoading(true);
            const data = await getPublicRooms(searchQuery);
            setRooms(data.rooms);
        } catch (error) {
            console.error('검색 실패:', error);
            showToast('검색에 실패했습니다', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 그룹 생성
    const handleCreateRoom = async (data: RoomCreateRequest) => {
        try {
            const newRoom = await createRoom(data);
            showToast('그룹이 생성되었습니다!', 'success');
            setMyRoom(newRoom);
            setIsCreateModalOpen(false);
            await loadData();
        } catch (error: unknown) {
            console.error('그룹 생성 실패:', error);
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '그룹 생성에 실패했습니다';
            showToast(message, 'error');
            throw error;
        }
    };

    // 공개 방 참여
    const handleJoin = async (roomId: number) => {
        try {
            await joinPublicRoom(roomId);
            showToast('그룹에 참여했습니다!', 'success');
            await loadData();
        } catch (error: unknown) {
            console.error('참여 실패:', error);
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '그룹 참여에 실패했습니다';
            showToast(message, 'error');
        }
    };

    // 비밀 방 참여
    const handleJoinPrivate = async (joinCode: string): Promise<MemberResponse> => {
        try {
            const response = await joinPrivateRoom({ joinCode });
            showToast('그룹에 참여했습니다!', 'success');
            setIsJoinModalOpen(false);
            await loadData();
            return response;
        } catch (error: unknown) {
            console.error('참여 실패:', error);
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '참여 코드가 올바르지 않습니다';
            throw new Error(message);
        }
    };

    // 토스트 메시지 표시
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // 내 그룹으로 이동
    const goToMyRoom = () => {
        if (myRoom) {
            window.location.href = `/community/room/${myRoom.roomId}`;
        }
    };

    return (
        <Layout>
            <ContainerContent>
                <div style={{ padding: '40px 0' }}>
                    {/* 헤더 */}
                    <div style={{ marginBottom: '32px' }}>
                        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px', margin: 0 }}>
                            커뮤니티
                        </h1>
                        <p style={{ fontSize: '16px', color: '#666666', margin: 0 }}>
                            그룹에 참여하여 다른 투자자들과 소통하세요
                        </p>
                    </div>

                    {/* 내가 속한 그룹 표시 */}
                    {myRoom && (
                        <div
                            onClick={goToMyRoom}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '20px 24px',
                                background: 'linear-gradient(135deg, #203C2E, #2A5038)',
                                borderRadius: '8px',
                                marginBottom: '32px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500', marginBottom: '8px' }}>
                                    참여 중인 그룹
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF' }}>
                                    {myRoom.name}
                                </div>
                            </div>
                            <button
                                style={{
                                    padding: '8px 24px',
                                    background: '#FFFFFF',
                                    color: '#203C2E',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                }}
                            >
                                입장하기 →
                            </button>
                        </div>
                    )}

                    {/* 검색 및 액션 버튼 */}
                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        marginBottom: '32px',
                        flexWrap: 'wrap',
                    }}>
                        {/* 검색바 */}
                        <div style={{ flex: 1, display: 'flex', gap: '8px', minWidth: '300px' }}>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="그룹 검색"
                                style={{
                                    flex: 1,
                                    height: '48px',
                                    padding: '0 16px',
                                    border: '1px solid #E5E5E5',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                }}
                            />
                            <button
                                onClick={handleSearch}
                                style={{
                                    padding: '0 24px',
                                    background: '#203C2E',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                검색
                            </button>
                        </div>

                        {/* 액션 버튼 (내 그룹이 없을 때만) */}
                        {!myRoom && (
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
                                        whiteSpace: 'nowrap',
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
                                        whiteSpace: 'nowrap',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#162B20';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#203C2E';
                                    }}
                                >
                                    그룹 생성
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 그룹 목록 */}
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
                            공개 그룹
                        </h2>

                        {loading ? (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: '400px',
                            }}>
                                <div style={{ fontSize: '16px', color: '#666666' }}>로딩 중...</div>
                            </div>
                        ) : rooms.length === 0 ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '400px',
                                padding: '40px 20px',
                            }}>
                                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏠</div>
                                <div style={{
                                    fontSize: '14px',
                                    color: '#666666',
                                    textAlign: 'center',
                                    lineHeight: '1.6',
                                    whiteSpace: 'pre-line',
                                }}>
                                    {searchQuery
                                        ? `"${searchQuery}" 검색 결과가 없습니다\n다른 키워드로 검색하거나 새로운 그룹을 만들어보세요`
                                        : '공개 그룹이 아직 없습니다\n첫 번째 그룹을 만들어보세요!'}
                                </div>
                            </div>
                        ) : (
                            <div>
                                {rooms.map((room) => (
                                    <GroupCard key={room.roomId} room={room} onJoin={handleJoin} />
                                ))}
                            </div>
                        )}
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

            {/* 토스트 알림 */}
            {toast && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        padding: '16px 24px',
                        background: toast.type === 'success' ? '#4CAF50' : '#DC0000',
                        color: '#FFFFFF',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        zIndex: 9999,
                        animation: 'slideIn 0.3s ease',
                    }}
                >
                    {toast.message}
                </div>
            )}
        </Layout>
    );
};