/**
 * ChatRoomPage - 채팅방 페이지
 * 핵심: 채팅방 진입 시 항상 API에서 최신 메시지를 로드
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useOpenVidu } from '@/hooks/useOpenVidu';
import apiClient from '@/api/client';
import { getMyRoom, leaveRoom, getRoomMembers, getChatMessages, sendChatMessage, markAsRead } from '@/api/communityApi';
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

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;

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

const fetchMyNickname = async (): Promise<string> => {
    try {
        const response = await apiClient.get('/users/me');
        const nickname = response.data.nickname || '알 수 없음';
        localStorage.setItem('userNickname', nickname);
        console.log('[ChatRoom] 사용자 닉네임 로드:', nickname);
        return nickname;
    } catch (err) {
        console.error('[ChatRoom] 닉네임 로드 실패:', err);
        return localStorage.getItem('userNickname') || '알 수 없음';
    }
};

const MESSAGE_CACHE_PREFIX = 'chat_messages_room_';
const MAX_CACHED_MESSAGES = 500;

const getCachedMessages = (roomId: string): ChatMessage[] => {
    try {
        const cached = localStorage.getItem(`${MESSAGE_CACHE_PREFIX}${roomId}`);
        if (cached) return JSON.parse(cached);
    } catch (err) {
        console.warn('[ChatRoom] 캐시 메시지 로드 실패:', err);
    }
    return [];
};

const saveCachedMessages = (roomId: string, messages: ChatMessage[]) => {
    try {
        const trimmed = messages.slice(-MAX_CACHED_MESSAGES);
        localStorage.setItem(`${MESSAGE_CACHE_PREFIX}${roomId}`, JSON.stringify(trimmed));
    } catch (err) {
        console.warn('[ChatRoom] 캐시 메시지 저장 실패:', err);
    }
};

const clearCachedMessages = (roomId: string) => {
    try {
        localStorage.removeItem(`${MESSAGE_CACHE_PREFIX}${roomId}`);
    } catch {
        // 무시
    }
};

const ChatRoomPage = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();

    const [room, setRoom] = useState<RoomResponse | null>(null);
    const [loading, setLoading] = useState(true);
    // ✅ 초기값: 캐시에서 즉시 복원 (빈 화면 방지)
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        if (roomId) {
            const cached = getCachedMessages(roomId);
            if (cached.length > 0) {
                console.log(`[ChatRoom] 캐시에서 ${cached.length}개 메시지 즉시 표시`);
                return cached;
            }
        }
        return [];
    });
    const [inputMessage, setInputMessage] = useState('');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [showParticipants, setShowParticipants] = useState(false);
    const [participants, setParticipants] = useState<RoomMemberDto[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string; text: string } | null>(null);
    const [myNickname, setMyNickname] = useState<string>('');
    const [realMemberCount, setRealMemberCount] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const reconnectAttempts = useRef(0);
    const hasLeftRef = useRef(false);
    const isLeavingRef = useRef(false);
    // ✅ 백엔드 signal 중복 방지용
    const recentlySentRef = useRef<Set<string>>(new Set());
    const historyLoadedRef = useRef(false);

    const addToast = useCallback((type: Toast['type'], title: string, message?: string) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    interface SimpleMessage {
        userName: string;
        message: string;
        createdAt: string;
        isMine: boolean;
        isSystem?: boolean;
    }

    const handleMessageReceived = (message: SimpleMessage) => {
        // ✅ 중복 방지: 내가 보낸 메시지의 signal echo → 모두 무시 (key 삭제 안함, timeout이 정리)
        const dedupKey = `${message.userName}::${message.message}`;
        if (recentlySentRef.current.has(dedupKey)) {
            console.log('[ChatRoom] 중복 signal 무시:', dedupKey);
            return; // key 삭제 안함 → 백엔드 signal도 차단됨
        }
        // ✅ isMine을 닉네임 비교로 판별 (useOpenVidu의 판별이 부정확할 수 있으므로)
        const isMine = message.userName === myNickname;
        setMessages(prev => [...prev, { ...message, isMine, id: Date.now().toString() }]);
    };

    const handleSessionIdChanged = (newSessionId: string) => {
        setSessionId(newSessionId);
    };

    const {
        connected,
        connecting,
        error,
        connect,
        disconnect,
    } = useOpenVidu({
        sessionId,
        userName: myNickname,
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

    // 마운트 시 사용자 닉네임 로드
    useEffect(() => {
        fetchMyNickname().then(setMyNickname);
    }, []);

    // 메시지 변경 시 localStorage 캐시에 저장
    useEffect(() => {
        if (roomId && messages.length > 0) {
            saveCachedMessages(roomId, messages);
        }
    }, [roomId, messages]);

    // ✅ 채팅방 진입 시 읽음 처리
    useEffect(() => {
        if (!roomId) return;
        markAsRead(Number(roomId)).catch((err) => {
            console.warn('[ChatRoom] markAsRead 실패 (무시):', err);
        });
    }, [roomId]);

    // ✅ 메시지 수신 시 읽음 처리 (2초 디바운스)
    useEffect(() => {
        if (!roomId || messages.length === 0) return;
        const timer = setTimeout(() => {
            markAsRead(Number(roomId)).catch(() => {});
        }, 2000);
        return () => clearTimeout(timer);
    }, [roomId, messages.length]);

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

    /**
     * ✅ [핵심 수정] 메시지 히스토리 로드
     * - 항상 API에서 최신 메시지를 가져옴
     * - 캐시는 초기 즉시 표시용 (깜빡임 방지)
     * - API 응답이 오면 캐시를 덮어씀
     */
    useEffect(() => {
        if (!room || !roomId) return;

        const loadMessageHistory = async () => {
            try {
                console.log('[ChatRoom] API에서 메시지 히스토리 로드 시작...');
                const chatMessages = await getChatMessages(Number(roomId));

                if (chatMessages && chatMessages.length > 0) {
                    // 현재 유저 ID 추출
                    let currentUserId: number | null = null;
                    try {
                        const token = localStorage.getItem('accessToken');
                        if (token) {
                            const payload = JSON.parse(atob(token.split('.')[1]));
                            // ✅ 연산자 우선순위 수정: userId 우선, 없으면 sub 사용
                            if (payload.userId != null) {
                                currentUserId = Number(payload.userId);
                            } else if (payload.sub != null) {
                                currentUserId = Number(payload.sub);
                            }
                            console.log('[ChatRoom] JWT에서 추출한 userId:', currentUserId, 'payload:', { userId: payload.userId, sub: payload.sub });
                        }
                    } catch {
                        // 토큰 파싱 실패 시 무시
                    }

                    const historyMessages: ChatMessage[] = chatMessages.map((msg, index) => ({
                        id: `history-${index}-${msg.createdAt}`,
                        userName: msg.userName || '알 수 없음',
                        message: msg.message,
                        createdAt: msg.createdAt,
                        // ✅ userId 비교 우선, 실패 시 닉네임 비교 fallback
                        isMine: (currentUserId !== null && msg.userId === currentUserId)
                            || (msg.userName === myNickname),
                        isSystem: msg.type === 'system',
                    }));

                    console.log(`[ChatRoom] API에서 ${historyMessages.length}개 메시지 로드 완료`);
                    setMessages(historyMessages);
                    historyLoadedRef.current = true;
                } else {
                    console.log('[ChatRoom] API 응답: 메시지 없음');
                    // API에서 빈 배열이 오면 캐시도 비움 (일관성)
                }
            } catch (err) {
                console.error('[ChatRoom] 메시지 히스토리 로드 실패:', err);
                // API 실패 시 캐시된 메시지 유지 (이미 state에 있음)
                console.log('[ChatRoom] API 실패 → 캐시 메시지 유지');
            }
        };

        loadMessageHistory();
    }, [room, roomId]);

    // OpenVidu 연결
    useEffect(() => {
        if (sessionId && myNickname && !connected && !connecting) {
            connect();
        }
    }, [sessionId, myNickname, connected, connecting, connect]);

    // 15초 폴링
    useEffect(() => {
        if (!roomId) return;

        const pollRoomData = async () => {
            try {
                const myRoom = await getMyRoom();
                if (myRoom && myRoom.roomId === Number(roomId)) {
                    setRoom(myRoom);
                }
                const membersResponse = await getRoomMembers(Number(roomId));
                setRealMemberCount(membersResponse.totalMembers);
            } catch {
                // 폴링 실패는 무시
            }
        };

        pollRoomData();
        const intervalId = setInterval(pollRoomData, 15000);
        return () => clearInterval(intervalId);
    }, [roomId]);

    useEffect(() => {
        // ✅ 히스토리 최초 로드 시 즉시 맨 아래로, 이후 메시지는 smooth 스크롤
        const behavior = historyLoadedRef.current ? 'smooth' : 'auto';
        messagesEndRef.current?.scrollIntoView({ behavior });
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const loadParticipants = async () => {
        if (!roomId) return;
        setLoadingParticipants(true);
        try {
            const response: RoomMemberListResponse = await getRoomMembers(Number(roomId));
            setParticipants(response.members);
            setRealMemberCount(response.totalMembers);
        } catch (err) {
            console.error('참여자 목록 로드 실패:', err);
        } finally {
            setLoadingParticipants(false);
        }
    };

    const handleToggleParticipants = () => {
        if (!showParticipants) loadParticipants();
        setShowParticipants(!showParticipants);
    };

    const handleSendMessage = () => {
        if (!inputMessage.trim() || !connected) return;
        const trimmedMessage = inputMessage.trim();

        // 1️⃣ ✅ 로컬에 즉시 추가 (본인 화면에 바로 표시)
        const localMessage: ChatMessage = {
            id: `local-${Date.now()}`,
            userName: myNickname,
            message: trimmedMessage,
            createdAt: new Date().toISOString(),
            isMine: true,
        };
        setMessages(prev => [...prev, localMessage]);

        // 2️⃣ ✅ 중복 방지 등록 (백엔드 signal echo 차단)
        const dedupKey = `${myNickname}::${trimmedMessage}`;
        recentlySentRef.current.add(dedupKey);
        setTimeout(() => recentlySentRef.current.delete(dedupKey), 5000);

        // 3️⃣ ✅ 백엔드 API만 호출 (Redis 저장 + 백엔드가 signal 전송)
        //    → 프론트에서 signal 직접 전송 안 함 (보안: 메시지 조작 방지)
        if (sessionId) {
            sendChatMessage({
                openviduSessionId: sessionId,
                sender: myNickname,
                message: trimmedMessage,
                type: 'chat',
            }).catch((err) => {
                console.error('[ChatRoom] 메시지 전송 실패:', err);
                addToast('error', '메시지 전송에 실패했습니다');
            });
        }

        setInputMessage('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleManualReconnect = () => {
        if (sessionId && !connecting) {
            reconnectAttempts.current += 1;
            connect();
        }
    };

    const handleLeaveRoom = async () => {
        if (!roomId || isLeavingRef.current) return;
        isLeavingRef.current = true;
        hasLeftRef.current = true;
        clearCachedMessages(roomId);

        try { disconnect(); } catch { /* 무시 */ }

        try {
            await leaveRoom(Number(roomId));
            addToast('success', '그룹을 나갔습니다');
        } catch {
            // API 실패해도 이동
        }

        navigate('/community');
    };

    const handleMessageContextMenu = (e: React.MouseEvent, messageId: string, text: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, messageId, text });
    };

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

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const period = hours >= 12 ? '오후' : '오전';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${period} ${displayHours}:${minutes}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

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

    const displayMemberCount = realMemberCount ?? room?.currentMemberCount ?? 0;

    // 로딩 스켈레톤
    if (loading) {
        return (
            <Layout showFooter={false}>
                <div className="chat-room-container">
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
                    <h2>채팅방을 찾을 수 없습니다</h2>
                    <p>이미 삭제되었거나 접근 권한이 없습니다.</p>
                    <button className="error-back-btn" onClick={() => navigate('/community')}>
                        커뮤니티로 돌아가기
                    </button>
                </div>
            </Layout>
        );
    }

    const messageGroups = groupMessagesByDate(messages);

    return (
        <Layout showFooter={false}>
            <div className="chat-room-container">
                {/* ===== 헤더 ===== */}
                <div className="chat-header">
                    <div className="chat-header-left">
                        <div className="chat-header-info">
                            <h2 className="chat-room-name">{room.name}</h2>
                            <div className="chat-room-meta">
                                <span className={`chat-online-dot ${connectionStatus === 'connected' ? 'connected' : connectionStatus === 'connecting' ? 'reconnecting' : 'disconnected'}`} />
                                <span className="chat-participant-count">
                                        {displayMemberCount}명 참여 중
                                    </span>
                                <span className="chat-room-type-tag">
                                        {room.isPublic ? '공개방' : '비공개방'}
                                    </span>
                                {!room.isPublic && room.joinCode && (
                                    <button
                                        className="chat-copy-code-btn"
                                        onClick={() => {
                                            navigator.clipboard.writeText(room.joinCode || '');
                                            addToast('info', '참여 코드가 복사되었습니다');
                                        }}
                                    >
                                        🔑 {room.joinCode}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="chat-header-actions">
                        {connectionStatus === 'disconnected' && (
                            <button className="reconnect-btn" onClick={handleManualReconnect}>
                                🔄 재연결
                            </button>
                        )}
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

                {/* 에러 배너 */}
                {error && (
                    <div className="chat-error-banner">
                        <span>⚠️ {error}</span>
                        <button onClick={handleManualReconnect}>재연결</button>
                    </div>
                )}

                {/* ===== 메인 영역 ===== */}
                <div className="chat-main">
                    <div className={`chat-messages-area ${showParticipants ? 'with-sidebar' : ''}`}>
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
                                        <div className="chat-date-divider">
                                            <div className="chat-date-line" />
                                            <span className="chat-date-text">{group.date}</span>
                                            <div className="chat-date-line" />
                                        </div>

                                        {group.messages.map((msg) => {
                                            if (msg.isSystem) {
                                                return (
                                                    <div key={msg.id} className="system-message">
                                                        <span>{msg.message}</span>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`chat-message ${msg.isMine ? 'mine' : 'others'}`}
                                                    onContextMenu={(e) => handleMessageContextMenu(e, msg.id, msg.message)}
                                                >
                                                    {!msg.isMine && (
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
                                    onKeyDown={handleKeyDown}
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
                                <button className="participants-close-btn" onClick={() => setShowParticipants(false)}>
                                    ✕
                                </button>
                            </div>
                            <div className="participants-list">
                                {loadingParticipants ? (
                                    <div className="participants-loading">불러오는 중...</div>
                                ) : (
                                    participants.map((member) => (
                                        <div key={member.memberId} className="participant-item">
                                            <div className="participant-info">
                                                    <span className="participant-name">
                                                        {member.nickname}
                                                        {member.isOwner && <span className="owner-badge">방장</span>}
                                                    </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 컨텍스트 메뉴 */}
                {contextMenu && (
                    <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
                        <button className="context-menu-item" onClick={handleCopyMessage}>
                            <span className="context-menu-icon">📋</span>
                            복사
                        </button>
                    </div>
                )}

                {/* 나가기 모달 */}
                {showLeaveModal && (
                    <div className="leave-modal-overlay" onClick={() => setShowLeaveModal(false)}>
                        <div className="leave-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="leave-modal-close" onClick={() => setShowLeaveModal(false)}>✕</button>
                            <h3>그룹 나가기</h3>
                            <p>그룹을 나가시겠습니까?</p>
                            <div className="leave-modal-actions">
                                <button className="leave-modal-cancel" onClick={() => setShowLeaveModal(false)}>취소</button>
                                <button className="leave-modal-confirm" onClick={handleLeaveRoom}>나가기</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 토스트 */}
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
                            <button className="toast-close" onClick={() => removeToast(toast.id)}>✕</button>
                            <div className="toast-progress" />
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default ChatRoomPage;