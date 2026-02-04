/**
 * ChatRoomPage - 채팅방 페이지
 * Figma 디자인 기반 (커뮤니티 대화)
 * - 로딩 스켈레톤
 * - 닉네임 아바타 (첫글자)
 * - 링크 자동 감지
 * - 연결 상태 표시
 * - 메시지 복사 기능
 * - 토스트 알림
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useOpenVidu } from '@/hooks/useOpenVidu';
import { getMyRoom, leaveRoom, getRoomMembers } from '@/api/communityApi';
import type { RoomResponse, RoomMemberListResponse, RoomMemberDto } from '@/features/community/types/CommunityTypes';
import './ChatRoomPage.css';

interface ChatMessage {
    id: string;
    userName: string;
    message: string;
    createdAt: string;
    isMine: boolean;
    isSystem?: boolean;
}

interface Toast {
    id: string;
    type: 'success' | 'error' | 'info';
    title: string;
    message?: string;
}

// 연결 상태 타입
type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

// 아바타 배경색 배열
const AVATAR_COLORS = [
    { bg: '#C7D8B7', text: '#203C2E' },
    { bg: '#E3D9BD', text: '#96773D' },
    { bg: '#D4E5F7', text: '#2563EB' },
    { bg: '#F5D5D5', text: '#DC0000' },
    { bg: '#E8E0F0', text: '#6B21A8' },
];

// 닉네임 기반 색상 선택
const getAvatarColor = (nickname: string) => {
    const index = nickname.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
};

// URL 감지 정규식
const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;

// 메시지 내 링크 렌더링
const renderMessageWithLinks = (text: string) => {
    const parts = text.split(URL_REGEX);
    return parts.map((part, index) => {
        if (part.match(URL_REGEX)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="message-link"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </a>
            );
        }
        return part;
    });
};

const ChatRoomPage = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();

    const [room, setRoom] = useState<RoomResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [showParticipants, setShowParticipants] = useState(false);
    const [participants, setParticipants] = useState<RoomMemberDto[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string; text: string } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const reconnectAttempts = useRef(0);

    // 토스트 추가
    const addToast = useCallback((type: Toast['type'], title: string, message?: string) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, type, title, message }]);

        // 자동 제거 (3초)
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    // 토스트 제거
    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // SimpleMessage 타입 (useOpenVidu에서 전달받는 타입)
    interface SimpleMessage {
        userName: string;
        message: string;
        createdAt: string;
        isMine: boolean;
        isSystem?: boolean;
    }

    const handleMessageReceived = (message: SimpleMessage) => {
        setMessages(prev => [...prev, { ...message, id: Date.now().toString() }]);
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

    // 연결 상태 업데이트
    useEffect(() => {
        if (connected) {
            setConnectionStatus('connected');
            reconnectAttempts.current = 0;
        } else if (connecting) {
            setConnectionStatus('connecting');
        } else {
            setConnectionStatus('disconnected');
        }
    }, [connected, connecting]);

    // 방 정보 로드
    useEffect(() => {
        const loadRoom = async () => {
            try {
                setLoading(true);
                const myRoom = await getMyRoom();
                if (myRoom && myRoom.roomId === Number(roomId)) {
                    setRoom(myRoom);
                    setSessionId(myRoom.openviduSessionId || null);
                } else {
                    navigate('/community');
                }
            } catch (err) {
                console.error('방 정보 로드 실패:', err);
                addToast('error', '방 정보를 불러올 수 없습니다');
                navigate('/community');
            } finally {
                setLoading(false);
            }
        };
        loadRoom();
    }, [roomId, navigate, addToast]);

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

    // 컨텍스트 메뉴 닫기
    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

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

    // 수동 재연결
    const handleManualReconnect = () => {
        if (sessionId && !connecting) {
            reconnectAttempts.current += 1;
            connect();
        }
    };

    // 그룹 나가기
    const handleLeaveRoom = async () => {
        if (!roomId) return;
        try {
            disconnect();
            await leaveRoom(Number(roomId));
            addToast('success', '그룹을 나갔습니다');
            navigate('/community');
        } catch (err) {
            console.error('그룹 나가기 실패:', err);
            addToast('error', '그룹 나가기에 실패했습니다');
        }
    };

    // 메시지 우클릭 (컨텍스트 메뉴)
    const handleMessageContextMenu = (e: React.MouseEvent, messageId: string, text: string) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            messageId,
            text,
        });
    };

    // 메시지 복사
    const handleCopyMessage = async () => {
        if (!contextMenu) return;
        try {
            await navigator.clipboard.writeText(contextMenu.text);
            addToast('info', '메시지가 복사되었습니다');
        } catch (err) {
            console.error('복사 실패:', err);
        }
        setContextMenu(null);
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

    // 연결 상태를 CSS 클래스로 변환 (connecting → reconnecting)
    const getConnectionStatusClass = () => {
        if (connectionStatus === 'connecting') return 'reconnecting';
        return connectionStatus;
    };

    // 로딩 스켈레톤
    if (loading) {
        return (
            <Layout>
                <div className="chat-room-container">
                    {/* 헤더 스켈레톤 */}
                    <div className="chat-header">
                        <div className="chat-header-left">
                            <div className="chat-header-info">
                                <div className="skeleton skeleton-title" />
                                <div className="skeleton skeleton-meta" />
                            </div>
                        </div>
                        <div className="chat-header-actions">
                            <div className="skeleton skeleton-btn" />
                            <div className="skeleton skeleton-btn" />
                        </div>
                    </div>

                    {/* 메시지 스켈레톤 */}
                    <div className="chat-messages">
                        <div className="chat-date-divider">
                            <div className="chat-date-line" />
                            <div className="skeleton skeleton-date" />
                            <div className="chat-date-line" />
                        </div>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`skeleton-message ${i % 2 === 0 ? 'mine' : 'others'}`}>
                                {i % 2 !== 0 && <div className="skeleton skeleton-avatar" />}
                                <div className="skeleton-content">
                                    {i % 2 !== 0 && <div className="skeleton skeleton-name" />}
                                    <div className={`skeleton ${i % 2 === 0 ? 'skeleton-bubble-mine' : 'skeleton-bubble'}`} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 입력 영역 스켈레톤 */}
                    <div className="chat-input-area">
                        <div className="chat-input-wrapper">
                            <div className="skeleton skeleton-input" />
                        </div>
                        <div className="skeleton skeleton-send-btn" />
                    </div>
                </div>
            </Layout>
        );
    }

    if (!room) {
        return (
            <Layout>
                <div className="chat-error-state">
                    <div className="error-icon">⚠️</div>
                    <p>채팅방을 찾을 수 없습니다</p>
                    <button onClick={() => navigate('/community')} className="error-back-btn">
                        커뮤니티로 돌아가기
                    </button>
                </div>
            </Layout>
        );
    }

    const messageGroups = groupMessagesByDate(messages);

    return (
        <Layout>
            <div className="chat-room-container">
                {/* 연결 상태 배너 */}
                {connectionStatus !== 'connected' && (
                    <div className={`connection-status ${getConnectionStatusClass()}`}>
                        <div className="status-dot" />
                        <span className="status-text">
                            {connectionStatus === 'connecting' ? '재연결 중...' : '연결 끊김 • 재연결 시도 중'}
                        </span>
                        {connectionStatus === 'disconnected' && (
                            <button className="reconnect-btn" onClick={handleManualReconnect}>
                                수동 재연결
                            </button>
                        )}
                    </div>
                )}

                {/* 헤더 */}
                <div className="chat-header">
                    <div className="chat-header-left">
                        <div className="chat-header-info">
                            <h1 className="chat-room-name">{room.name}</h1>
                            <div className="chat-room-meta">
                                <span className={`chat-online-dot ${getConnectionStatusClass()}`} />
                                <span className="chat-participant-count">
                                    {participantCount > 0 ? participantCount : room.currentMemberCount}명 참여 중
                                </span>
                                <span className="chat-room-type-tag">
                                    {room.isPublic ? '공개방' : '비공개방'}
                                </span>
                            </div>
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
                        {/* 에러 상태 */}
                        {error && (
                            <div className="chat-error-banner">{error}</div>
                        )}

                        {/* 메시지 목록 */}
                        <div className="chat-messages">
                            {messages.length === 0 ? (
                                <div className="chat-empty">
                                    <div className="chat-empty-icon">
                                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                            <ellipse cx="32" cy="30" rx="26" ry="22" fill="#E8E0F0"/>
                                            <ellipse cx="32" cy="30" rx="22" ry="18" fill="#D4C8E8"/>
                                            <circle cx="22" cy="30" r="3" fill="#B8A8D4"/>
                                            <circle cx="32" cy="30" r="3" fill="#B8A8D4"/>
                                            <circle cx="42" cy="30" r="3" fill="#B8A8D4"/>
                                            <path d="M20 48 L26 38 L32 48 Z" fill="#E8E0F0"/>
                                        </svg>
                                    </div>
                                    <p>채팅을 시작해보세요!</p>
                                    <span className="chat-empty-hint">첫 번째 메시지를 보내보세요</span>
                                </div>
                            ) : (
                                messageGroups.map((group, groupIndex) => (
                                    <div key={groupIndex} className="chat-date-group">
                                        {/* 날짜 구분선 */}
                                        <div className="chat-date-divider">
                                            <div className="chat-date-line" />
                                            <span className="chat-date-text">{group.date}</span>
                                            <div className="chat-date-line" />
                                        </div>

                                        {/* 메시지들 */}
                                        {group.messages.map((msg) => {
                                            // 시스템 메시지
                                            if (msg.isSystem) {
                                                return (
                                                    <div key={msg.id} className="system-message">
                                                        <span>{msg.message}</span>
                                                    </div>
                                                );
                                            }

                                            const avatarColor = getAvatarColor(msg.userName);

                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`chat-message ${msg.isMine ? 'mine' : 'others'}`}
                                                    onContextMenu={(e) => handleMessageContextMenu(e, msg.id, msg.message)}
                                                >
                                                    {!msg.isMine && (
                                                        <>
                                                            {/* 아바타 */}
                                                            <div
                                                                className="message-avatar"
                                                                style={{
                                                                    backgroundColor: avatarColor.bg,
                                                                    color: avatarColor.text,
                                                                }}
                                                            >
                                                                {msg.userName.charAt(0)}
                                                            </div>
                                                            <div className="message-content-wrapper">
                                                                <div className="message-header">
                                                                    <span className="message-sender">{msg.userName}</span>
                                                                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                                                                </div>
                                                                <div className="message-bubble">
                                                                    <p className="message-content">
                                                                        {renderMessageWithLinks(msg.message)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                    {msg.isMine && (
                                                        <div className="message-content-wrapper mine">
                                                            <div className="message-time-right">
                                                                <span className="message-time">{formatTime(msg.createdAt)}</span>
                                                            </div>
                                                            <div className="message-bubble">
                                                                <p className="message-content">
                                                                    {renderMessageWithLinks(msg.message)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
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
                                    participants.map((member) => {
                                        return (
                                            <div key={member.memberId} className="participant-item">
                                                <div className="participant-info">
                                                    <span className="participant-name">
                                                        {member.nickname}
                                                        {member.isOwner && (
                                                            <span className="owner-badge">방장</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 컨텍스트 메뉴 (메시지 우클릭) */}
                {contextMenu && (
                    <div
                        className="context-menu"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <button className="context-menu-item" onClick={handleCopyMessage}>
                            <span className="context-menu-icon">📋</span>
                            복사
                        </button>
                    </div>
                )}

                {/* 나가기 확인 모달 */}
                {showLeaveModal && (
                    <div className="leave-modal-overlay" onClick={() => setShowLeaveModal(false)}>
                        <div className="leave-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="leave-modal-close" onClick={() => setShowLeaveModal(false)}>
                                ✕
                            </button>
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

                {/* 토스트 알림 */}
                <div className="toast-container">
                    {toasts.map((toast) => (
                        <div key={toast.id} className={`toast toast-${toast.type}`}>
                            <div className="toast-icon">
                                {toast.type === 'success' && '✓'}
                                {toast.type === 'error' && '✕'}
                                {toast.type === 'info' && 'ℹ'}
                            </div>
                            <div className="toast-content">
                                <span className="toast-title">{toast.title}</span>
                                {toast.message && <span className="toast-message">{toast.message}</span>}
                            </div>
                            <button className="toast-close" onClick={() => removeToast(toast.id)}>
                                ✕
                            </button>
                            <div className="toast-progress" />
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default ChatRoomPage;