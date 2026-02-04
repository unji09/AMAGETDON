/**
 * 커뮤니티 페이지
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import GroupCreateModal from '@/features/community/components/GroupCreateModal';
import JoinCodeModal from '@/features/community/components/JoinCodeModal';
import RankingCard from '@/features/ranking/components/RankingCard';
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
import './CommunityPage.css';

export const CommunityPage = () => {
    const navigate = useNavigate();

    // 상태 관리
    const [rooms, setRooms] = useState<RoomResponse[]>([]);
    const [myRoom, setMyRoom] = useState<RoomResponse | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

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
        try {
            setLoading(true);
            const data = await getPublicRooms(searchQuery.trim() || undefined);
            setRooms(data.rooms);
        } catch (error) {
            console.error('검색 실패:', error);
            showToast('검색에 실패했습니다', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 검색 초기화
    const handleResetSearch = () => {
        setSearchQuery('');
        loadData();
    };

    // 그룹 생성
    const handleCreateRoom = async (data: RoomCreateRequest) => {
        try {
            const newRoom = await createRoom(data);
            showToast('그룹이 생성되었습니다!', 'success');
            setMyRoom(newRoom);
            setIsCreateModalOpen(false);
            navigate(`/community/chat/${newRoom.roomId}`);
        } catch (error: unknown) {
            console.error('그룹 생성 실패:', error);
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '그룹 생성에 실패했습니다';
            showToast(message, 'error');
            throw error;
        }
    };

    // 공개 방 참여
    const handleJoin = async (roomId: number) => {
        if (myRoom) return; // 이미 그룹이 있으면 참여 불가
        try {
            await joinPublicRoom(roomId);
            showToast('그룹에 참여했습니다!', 'success');
            navigate(`/community/chat/${roomId}`);
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
            navigate(`/community/chat/${response.roomId}`);
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
            navigate(`/community/chat/${myRoom.roomId}`);
        }
    };

    // 검색 결과가 없는지 확인
    const isSearchEmpty = searchQuery.trim() && rooms.length === 0 && !loading;

    return (
        <Layout>
            <div className="community-page">
                <div className="community-container">
                    {/* 헤더 */}
                    <div className="community-header">
                        <h1 className="community-title">커뮤니티</h1>
                        <p className="community-desc">그룹에 참여하여 다른 투자자들과 소통하세요</p>
                    </div>

                    {/* 내가 속한 그룹 표시 */}
                    {myRoom && (
                        <div className="my-room-banner" onClick={goToMyRoom}>
                            <div className="my-room-info">
                                <span className="my-room-label">참여 중인 그룹</span>
                                <span className="my-room-name">{myRoom.name}</span>
                            </div>
                            <button className="my-room-btn">
                                채팅방 입장 →
                            </button>
                        </div>
                    )}

                    {/* 검색 영역 */}
                    <div className="community-search-area">
                        {/* 검색창 (540px) */}
                        <div className={`search-input-wrapper ${isSearchFocused ? 'focused' : ''}`}>
                            <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="7" cy="7" r="5.5" stroke="#9CA3AF" strokeWidth="1.5"/>
                                <path d="M11 11L14 14" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                                placeholder="그룹 검색"
                                className="search-input"
                            />
                        </div>

                        {/* 참여코드 입력 */}
                        {!myRoom && (
                            <button
                                className="join-code-btn"
                                onClick={() => setIsJoinModalOpen(true)}
                            >
                                참여코드 입력
                            </button>
                        )}

                        {/* 그룹 생성 */}
                        {!myRoom && (
                            <button
                                className="create-group-btn"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                그룹 생성
                            </button>
                        )}
                    </div>

                    {/* 공개 그룹 영역 */}
                    <div className="public-groups-section">
                        {/* 헤더 (44px) */}
                        <div className="public-groups-header">
                            <span className="public-groups-label">공개 그룹</span>
                            <span className="public-groups-count-label">인원</span>
                        </div>

                        {/* 그룹 목록 */}
                        <div className="public-groups-list">
                            {loading ? (
                                <>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="group-item">
                                            <div className="skeleton skeleton-checkbox" />
                                            <div className="skeleton skeleton-name" style={{ width: `${180 + i * 10}px` }} />
                                            <div className="skeleton skeleton-count" />
                                            <div className="skeleton skeleton-btn" />
                                        </div>
                                    ))}
                                </>
                            ) : rooms.length === 0 ? (
                                // 빈 상태
                                <div className="empty-state">
                                    <div className="empty-icon">
                                        {isSearchEmpty ? (
                                            // 검색 결과 없음 아이콘
                                            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                                                <circle cx="35" cy="35" r="20" stroke="#D1D5DB" strokeWidth="2"/>
                                                <path d="M50 50L65 65" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                        ) : (
                                            // 그룹 없음 아이콘
                                            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                                                <circle cx="40" cy="40" r="36" stroke="#E5E7EB" strokeWidth="2"/>
                                                <rect x="24" y="28" width="32" height="20" rx="4" stroke="#D1D5DB" strokeWidth="2"/>
                                                <line x1="30" y1="35" x2="50" y2="35" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"/>
                                                <line x1="30" y1="41" x2="44" y2="41" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                        )}
                                    </div>

                                    {isSearchEmpty ? (
                                        <>
                                            <p className="empty-title">"{searchQuery}" 검색 결과가 없습니다</p>
                                            <p className="empty-desc">다른 키워드로 검색하거나</p>
                                            <p className="empty-desc">새로운 그룹을 만들어보세요</p>
                                            <div className="empty-search-info">
                                                <span>총 0개의 그룹</span>
                                                <span className="separator">•</span>
                                                <span className="reset-link" onClick={handleResetSearch}>검색 조건 초기화</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="empty-title">공개 그룹이 아직 없습니다</p>
                                            <p className="empty-desc">첫 번째 그룹을 만들어보세요!</p>
                                            <p className="empty-desc">다른 투자자들과 정보를 공유하고 함께 성장하세요</p>
                                            {!myRoom && (
                                                <button
                                                    className="empty-create-btn"
                                                    onClick={() => setIsCreateModalOpen(true)}
                                                >
                                                    첫 그룹 만들기
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                // 그룹 목록
                                rooms.map((room) => {
                                    const isFull = room.currentMemberCount >= room.maxMemberCount;
                                    return (
                                        <div key={room.roomId} className="group-item">
                                            <div className="group-checkbox" />
                                            <span className="group-name">{room.name}</span>
                                            <span className={`group-count ${isFull ? 'group-count--full' : ''}`}>
                                                {room.currentMemberCount}/{room.maxMemberCount}
                                            </span>
                                            <button
                                                className={`group-join-btn ${isFull ? 'group-join-btn--disabled' : ''}`}
                                                onClick={() => !isFull && !myRoom && handleJoin(room.roomId)}
                                                disabled={isFull || !!myRoom}
                                            >
                                                {isFull ? '정원 마감' : '참여하기'}
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* 랭킹 카드 섹션 */}
                    <div className="ranking-section">
                        <RankingCard type="profit" />
                        <RankingCard type="learning" />
                    </div>
                </div>
            </div>

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
                <div className={`community-toast community-toast--${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </Layout>
    );
};

export default CommunityPage;