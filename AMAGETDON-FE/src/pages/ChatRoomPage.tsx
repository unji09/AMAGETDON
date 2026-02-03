/**
 * ChatRoomPage - 채팅방 페이지
 * Figma 디자인 기반 (커뮤니티 대화)
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOpenVidu } from '@/hooks/useOpenVidu';
import { getMyRoom, leaveRoom, getRoomMembers } from '@/api/communityApi';
import type { RoomResponse, RoomMemberListResponse, RoomMemberDto } from '@/features/community/types/CommunityTypes';
import './ChatRoomPage.css';

interface ChatMessage {
    userName: string;
    message: string;
    createdAt: string;
    isMine: boolean;
}

const ChatRoomPage = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();

    const [room, setRoom] = useState<RoomResponse | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [showParticipants, setShowParticipants] = useState(false);
    const [participants, setParticipants] = useState<RoomMemberDto[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleMessageReceived = (message: ChatMessage) => {
        setMessages(prev => [...prev, message]);
    };

    const handleSessionIdChanged = (newSessionId: string) => {
        setSessionId(newSessionId);
    };

    const {
        connected,
        connecting,
        error,
        participantCount,
        connect,
        disconnect,
        sendMessage: sendOpenViduMessage,
    } = useOpenVidu({
        sessionId,
        onMessageReceived: handleMessageReceived,
        onSessionIdChanged: handleSessionIdChanged,
    });

    // 방 정보 로드
    useEffect(() => {
        const loadRoom = async () => {
            try {
                const myRoom = await getMyRoom();
                if (myRoom && myRoom.roomId === Number(roomId)) {
                    setRoom(myRoom);
                    setSessionId(myRoom.openviduSessionId || null);
                } else {
                    navigate('/community');
                }
            } catch (err) {
                console.error('방 정보 로드 실패:', err);
                navigate('/community');
            }
        };
        loadRoom();
    }, [roomId, navigate]);

    // OpenVidu 연결
    useEffect(() => {
        if (sessionId && !connected && !connecting) {
            connect();
        }
    }, [sessionId, connected, connecting, connect]);

    // 메시지 스크롤
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 참여자 목록 로드
    const loadParticipants = async () => {
        if (!roomId) return;
        setLoadingParticipants(true);
        try {
            const response: RoomMemberListResponse = await getRoomMembers(Number(roomId));
            setParticipants(response.members);
        } catch (err) {
            console.error('참여자 목록 로드 실패:', err);
        } finally {
            setLoadingParticipants(false);
        }
    };

    // 참여자 보기 토글
    const handleToggleParticipants = () => {
        if (!showParticipants) {
            loadParticipants();
        }
        setShowParticipants(!showParticipants);
    };

    // 메시지 전송
    const handleSendMessage = () => {
        if (!inputMessage.trim() || !connected) return;
        sendOpenViduMessage(inputMessage.trim());
        setInputMessage('');
    };

    // 엔터 키 전송
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // 그룹 나가기
    const handleLeaveRoom = async () => {
        if (!roomId) return;
        try {
            disconnect();
            await leaveRoom(Number(roomId));
            navigate('/community');
        } catch (err) {
            console.error('그룹 나가기 실패:', err);
        }
    };

    // 시간 포맷
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const period = hours >= 12 ? '오후' : '오전';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${period} ${displayHours}:${minutes}`;
    };

    // 날짜 포맷
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    // 날짜 그룹화
    const groupMessagesByDate = (msgs: ChatMessage[]) => {
        const groups: { date: string; messages: ChatMessage[] }[] = [];
        let currentDate = '';

        msgs.forEach(msg => {
            const msgDate = formatDate(msg.createdAt);
            if (msgDate !== currentDate) {
                currentDate = msgDate;
                groups.push({ date: msgDate, messages: [msg] });
            } else {
                groups[groups.length - 1].messages.push(msg);
            }
        });

        return groups;
    };

    if (!room) {
        return (
            <div className="chat-loading">
                <div className="chat-loading-spinner" />
                <p>채팅방을 불러오는 중...</p>
            </div>
        );
    }

    const messageGroups = groupMessagesByDate(messages);

    return (
        <div className="chat-room-container">
            {/* 헤더 */}
            <div className="chat-header">
                <div className="chat-header-info">
                    <h1 className="chat-room-name">{room.name}</h1>
                    <div className="chat-room-meta">
                        <span className="chat-online-dot" />
                        <span className="chat-participant-count">
                            {participantCount > 0 ? participantCount : room.currentMemberCount}명 참여 중
                        </span>
                        <span className="chat-room-type-tag">
                            {room.isPublic ? '공개방' : '비공개방'}
                        </span>
                    </div>
                </div>
                <div className="chat-header-actions">
                    <button
                        className={`chat-action-btn participants-btn ${showParticipants ? 'active' : ''}`}
                        onClick={handleToggleParticipants}
                    >
                        <span className="dots-icon">
                            <span className="dot" />
                            <span className="dot" />
                            <span className="dot" />
                        </span>
                        참여자 보기
                    </button>
                    <button
                        className="chat-action-btn leave-btn"
                        onClick={() => setShowLeaveModal(true)}
                    >
                        그룹 나가기
                    </button>
                </div>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="chat-main">
                {/* 채팅 영역 */}
                <div className={`chat-messages-area ${showParticipants ? 'with-sidebar' : ''}`}>
                    {/* 연결 상태 */}
                    {connecting && (
                        <div className="chat-status connecting">연결 중...</div>
                    )}
                    {error && (
                        <div className="chat-status error">{error}</div>
                    )}

                    {/* 메시지 목록 */}
                    <div className="chat-messages">
                        {messages.length === 0 ? (
                            <div className="chat-empty">
                                <div className="chat-empty-icon">💬</div>
                                <p>채팅을 시작해보세요!</p>
                            </div>
                        ) : (
                            messageGroups.map((group, groupIndex) => (
                                <div key={groupIndex} className="chat-date-group">
                                    {/* 날짜 구분선 */}
                                    <div className="chat-date-divider">
                                        <span className="chat-date-line" />
                                        <span className="chat-date-text">{group.date}</span>
                                        <span className="chat-date-line" />
                                    </div>

                                    {/* 메시지들 */}
                                    {group.messages.map((msg, msgIndex) => (
                                        <div
                                            key={msgIndex}
                                            className={`chat-message ${msg.isMine ? 'mine' : 'others'}`}
                                        >
                                            {!msg.isMine && (
                                                <div className="message-header">
                                                    <span className="message-sender">{msg.userName}</span>
                                                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                                                </div>
                                            )}
                                            {msg.isMine && (
                                                <div className="message-time-right">
                                                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                                                </div>
                                            )}
                                            <div className="message-bubble">
                                                <p className="message-content">{msg.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* 입력 영역 */}
                    <div className="chat-input-area">
                        <div className="chat-input-wrapper">
                            <input
                                type="text"
                                className="chat-input"
                                placeholder="메시지를 입력하세요..."
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={!connected}
                            />
                        </div>
                        <button
                            className="chat-send-btn"
                            onClick={handleSendMessage}
                            disabled={!connected || !inputMessage.trim()}
                        >
                            전송
                        </button>
                    </div>
                </div>

                {/* 참여자 사이드바 */}
                {showParticipants && (
                    <div className="chat-participants-sidebar">
                        <div className="participants-header">
                            <h3>참여자 목록</h3>
                            <span className="participants-count">{participants.length}명</span>
                            <button
                                className="participants-close-btn"
                                onClick={() => setShowParticipants(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="participants-list">
                            {loadingParticipants ? (
                                <div className="participants-loading">불러오는 중...</div>
                            ) : (
                                participants.map((member) => (
                                    <div key={member.memberId} className="participant-item">
                                        <div className="participant-avatar">
                                            {member.nickname.charAt(0)}
                                        </div>
                                        <div className="participant-info">
                                            <span className="participant-name">
                                                {member.nickname}
                                                {member.isOwner && (
                                                    <span className="owner-badge">방장</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 나가기 확인 모달 */}
            {showLeaveModal && (
                <div className="leave-modal-overlay" onClick={() => setShowLeaveModal(false)}>
                    <div className="leave-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>그룹 나가기</h3>
                        <p>정말 '{room.name}' 그룹을 나가시겠습니까?</p>
                        <div className="leave-modal-actions">
                            <button
                                className="leave-modal-cancel"
                                onClick={() => setShowLeaveModal(false)}
                            >
                                취소
                            </button>
                            <button
                                className="leave-modal-confirm"
                                onClick={handleLeaveRoom}
                            >
                                나가기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatRoomPage;