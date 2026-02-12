/**
 * FloatingChatButton - 커뮤니티 플로팅 채팅 버튼
 * Figma: 56x56 원형, #203C2E, 호버 시 그룹명 툴팁, 읽지 않은 메시지 배지
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMyRoom, getUnreadCount } from '@/api/communityApi';
import type { RoomResponse } from '@/features/community/types/CommunityTypes';
import './FloatingChatButton.css';

const POLL_INTERVAL = 15000;

const FloatingChatButton = () => {
    const [myRoom, setMyRoom] = useState<RoomResponse | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showTooltip, setShowTooltip] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // 커뮤니티 관련 페이지에서는 숨기기
    const isCommunityPage = location.pathname.startsWith('/community');

    // 데이터 로드
    const fetchData = useCallback(async () => {
        try {
            const roomData = await getMyRoom();
            setMyRoom(roomData);

            if (roomData) {
                try {
                    const data = await getUnreadCount(roomData.roomId);
                    console.log('[FloatingChat] unread API 응답:', data);

                    // ✅ 다양한 응답 형식 대응
                    let newCount = 0;
                    if (typeof data === 'number') {
                        newCount = data;
                    } else if (data && typeof data === 'object') {
                        // { unreadCount: 3 } 또는 { data: { unreadCount: 3 } } 또는 { data: 3 }
                        newCount = data.unreadCount
                            ?? (data as any).data?.unreadCount
                            ?? (data as any).data
                            ?? 0;
                    }

                    if (typeof newCount !== 'number' || isNaN(newCount)) {
                        newCount = 0;
                    }

                    setUnreadCount(prev => {
                        if (newCount > prev) {
                            setIsAnimating(true);
                            setTimeout(() => setIsAnimating(false), 600);
                        }
                        return newCount;
                    });
                } catch (err) {
                    console.warn('[FloatingChat] unread API 실패:', err);
                    // unread API 실패해도 버튼은 계속 표시
                }
            } else {
                setUnreadCount(0);
            }
        } catch {
            // getMyRoom 실패 시 무시 (로그인 안 된 상태 등)
        }
    }, []);

    // 초기 로드 + 폴링
    useEffect(() => {
        if (isCommunityPage) return;

        const timer = setTimeout(() => {
            fetchData();
        }, 0);
        const interval = setInterval(fetchData, POLL_INTERVAL);
        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [fetchData, isCommunityPage, location.pathname]);

    // 커뮤니티 페이지이거나 참여 중인 방이 없으면 렌더링 안 함
    if (isCommunityPage || !myRoom) return null;

    const handleClick = () => {
        navigate(`/community/chat/${myRoom.roomId}`);
    };

    return (
        <div
            className="floating-chat-container"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* 호버 시 그룹명 툴팁 */}
            {showTooltip && (
                <div className="floating-chat-tooltip">
                    <span className="floating-chat-tooltip-text">{myRoom.name}</span>
                    <div className="floating-chat-tooltip-arrow" />
                </div>
            )}

            {/* 플로팅 버튼 */}
            <button
                className={`floating-chat-btn ${isAnimating ? 'floating-chat-btn--bounce' : ''}`}
                onClick={handleClick}
                aria-label={`${myRoom.name} 채팅방으로 이동`}
            >
                {/* Figma: 채팅 아이콘 (말풍선 + 선) */}
                <svg
                    className="floating-chat-icon"
                    width="28"
                    height="20"
                    viewBox="0 0 28 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M2 2C2 0.9 2.9 0 4 0H24C25.1 0 26 0.9 26 2V14C26 15.1 25.1 16 24 16H8L2 20V2Z"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                    />
                    <line x1="8" y1="13" x2="20" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>

                {/* 읽지 않은 메시지 배지 */}
                {unreadCount > 0 && (
                    <span className="floating-chat-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
};

export default FloatingChatButton;