/**
 * ChatRoomPage - 채팅방 페이지
 * 그룹 채팅 메시지 표시 및 전송
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { getChatMessages, sendChatMessage, getMyRoom, leaveRoom } from '@/api/communityApi';
import type { ChatMessage, RoomResponse } from '@/features/community/types/CommunityTypes';
import './ChatRoomPage.css';

const ChatRoomPage = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();

    const [room, setRoom] = useState<RoomResponse | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 메시지 목록 스크롤
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // 초기 데이터 로딩
    useEffect(() => {
        loadInitialData();
    }, [roomId]);

    // 메시지 변경 시 스크롤
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadInitialData = async () => {
        try {
            setLoading(true);

            // 내가 속한 그룹 정보 가져오기
            const myRoom = await getMyRoom();
            if (!myRoom) {
                alert('참여 중인 그룹이 없습니다.');
                navigate('/community');
                return;
            }

            setRoom(myRoom);

            // 채팅 메시지 가져오기
            const chatMessages = await getChatMessages(myRoom.roomId);
            setMessages(chatMessages);
        } catch (error) {
            console.error('데이터 로딩 실패:', error);
            alert('데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 메시지 전송
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !room) return;
        if (newMessage.length > 1000) {
            alert('메시지는 1000자 이내로 입력해주세요.');
            return;
        }

        // OpenVidu sessionId 확인
        if (!room.openviduSessionId) {
            alert('채팅 세션이 생성되지 않았습니다. OpenVidu 설정을 확인해주세요.');
            return;
        }

        try {
            setSending(true);

            await sendChatMessage({
                openviduSessionId: room.openviduSessionId,
                sender: '현재 사용자', // TODO: 실제 사용자 이름으로 변경
                message: newMessage,
                type: 'text',
            });

            // 메시지 목록 새로고침
            const updatedMessages = await getChatMessages(room.roomId);
            setMessages(updatedMessages);
            setNewMessage('');
        } catch (error) {
            console.error('메시지 전송 실패:', error);
            alert('메시지 전송에 실패했습니다.');
        } finally {
            setSending(false);
        }
    };

    // Enter 키로 전송
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // 그룹 나가기
    const handleLeaveRoom = async () => {
        if (!room) return;

        if (window.confirm('그룹을 나가시겠습니까?')) {
            try {
                await leaveRoom(room.roomId);
                alert('그룹에서 나갔습니다.');
                navigate('/community');
            } catch (error) {
                console.error('그룹 나가기 실패:', error);
                alert('그룹 나가기에 실패했습니다.');
            }
        }
    };

    // 날짜 포맷팅
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    // 시간 포맷팅
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const period = hours >= 12 ? '오후' : '오전';
        const displayHours = hours % 12 || 12;
        return `${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
    };

    // 날짜 구분선이 필요한지 확인
    const shouldShowDateDivider = (currentMsg: ChatMessage, prevMsg?: ChatMessage) => {
        if (!prevMsg) return true;

        const currentDate = new Date(currentMsg.createdAt).toDateString();
        const prevDate = new Date(prevMsg.createdAt).toDateString();

        return currentDate !== prevDate;
    };

    if (loading) {
        return (
            <Layout>
                <div className="chatroom-loading">
                    <div>로딩 중...</div>
                </div>
            </Layout>
        );
    }

    if (!room) {
        return (
            <Layout>
                <div className="chatroom-error">
                    <div>그룹 정보를 불러올 수 없습니다.</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="chatroom">
                {/* 헤더 */}
                <div className="chatroom-header">
                    <div className="chatroom-header__info">
                        <h1 className="chatroom-header__title">{room.name}</h1>
                        <div className="chatroom-header__meta">
                            <span className="chatroom-header__count">{room.currentMemberCount}명 참여 중</span>
                            <span className="chatroom-header__divider">•</span>
                            <span className="chatroom-header__type">
                                {room.isPublic ? '공개방' : '비밀방'}
                            </span>
                        </div>
                    </div>
                    <div className="chatroom-header__actions">
                        <button className="chatroom-header__button">참여자 보기</button>
                        <button
                            className="chatroom-header__button chatroom-header__button--danger"
                            onClick={handleLeaveRoom}
                        >
                            그룹 나가기
                        </button>
                    </div>
                </div>

                {/* 메시지 영역 */}
                <div className="chatroom-messages">
                    {messages.length === 0 ? (
                        <div className="chatroom-empty">
                            <div className="chatroom-empty__icon">💬</div>
                            <div className="chatroom-empty__text">아직 메시지가 없습니다</div>
                            <div className="chatroom-empty__subtext">첫 메시지를 보내보세요!</div>
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <div key={index}>
                                {/* 날짜 구분선 */}
                                {shouldShowDateDivider(message, messages[index - 1]) && (
                                    <div className="chatroom-date-divider">
                                        <span>{formatDate(message.createdAt)}</span>
                                    </div>
                                )}

                                {/* 메시지 */}
                                <div className="chatroom-message">
                                    <div className="chatroom-message__avatar">
                                        {message.userName.charAt(0)}
                                    </div>
                                    <div className="chatroom-message__content">
                                        <div className="chatroom-message__header">
                                            <span className="chatroom-message__name">{message.userName}</span>
                                            <span className="chatroom-message__time">{formatTime(message.createdAt)}</span>
                                        </div>
                                        <div className="chatroom-message__text">{message.message}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* 입력 영역 */}
                <div className="chatroom-input">
                    <div className="chatroom-input__container">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="메시지를 입력하세요..."
                            maxLength={1000}
                            disabled={sending}
                            className="chatroom-input__field"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sending}
                            className="chatroom-input__button"
                        >
                            {sending ? '전송 중...' : '전송'}
                        </button>
                    </div>
                    <div className="chatroom-input__counter">
                        {newMessage.length} / 1000
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ChatRoomPage;