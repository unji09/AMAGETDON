/**
 * ChatRoomPage - 채팅방 페이지
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useOpenVidu } from '@/hooks/useOpenVidu';
import { getMyRoom, sendChatMessage, leaveRoom } from '@/api/communityApi';
import ChatMessage from '@/features/community/components/ChatMessage';
import { getCurrentUserNickname } from '@/utils/jwtUtils';

interface Message {
    id: number;
    userName: string;
    message: string;
    createdAt: string;
    isMine: boolean;
}

interface RoomDetail {
    roomId: number;
    name: string;
    openviduSessionId: string;
    currentMemberCount: number;
    isPublic: boolean;
}

const ChatRoomPage: React.FC = () => {
    const navigate = useNavigate();

    const [roomDetail, setRoomDetail] = useState<RoomDetail | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentUserNickname = useRef<string>('');

    // ✅ 세션 ID 업데이트 핸들러
    const handleSessionIdChanged = useCallback((newSessionId: string) => {
        console.log('📝 [ChatRoomPage] 세션 ID 업데이트:', newSessionId);
        setRoomDetail(prev => prev ? { ...prev, openviduSessionId: newSessionId } : null);
    }, []);

    // OpenVidu 연결
    const {
        connected,
        connecting,
        error,
        participantCount,
        connect,
        disconnect,
        sendMessage: sendOpenViduMessage,
    } = useOpenVidu({
        sessionId: roomDetail?.openviduSessionId || null,
        onMessageReceived: (message) => {
            const newMessage: Message = {
                id: Date.now(),
                userName: message.userName,
                message: message.message,
                createdAt: message.createdAt,
                isMine: message.isMine,
            };
            setMessages((prev) => [...prev, newMessage]);
        },
        onParticipantChanged: (count) => {
            console.log('👥 참여자 수 변경:', count);
            // ✅ 참여자 수 변경 시 roomDetail 업데이트
            setRoomDetail(prev => prev ? { ...prev, currentMemberCount: count } : null);
        },
        onSessionIdChanged: handleSessionIdChanged,
    });

    // 방 정보 로드
    useEffect(() => {
        const loadRoomDetail = async () => {
            try {
                setLoading(true);
                // 내가 속한 방 정보 가져오기
                const myRoom = await getMyRoom();

                if (!myRoom) {
                    alert('참여 중인 방이 없습니다.');
                    navigate('/community');
                    return;
                }

                // openviduSessionId 유효성 검사
                if (!myRoom.openviduSessionId) {
                    console.error('❌ OpenVidu Session ID가 없습니다.');
                    alert('채팅방 정보가 올바르지 않습니다.');
                    navigate('/community');
                    return;
                }

                // RoomResponse를 RoomDetail 형태로 변환
                const detail: RoomDetail = {
                    roomId: myRoom.roomId,
                    name: myRoom.name,
                    openviduSessionId: myRoom.openviduSessionId,
                    currentMemberCount: myRoom.currentMemberCount || 1,
                    isPublic: myRoom.isPublic,
                };

                setRoomDetail(detail);

                // 현재 사용자 닉네임 저장
                currentUserNickname.current = getCurrentUserNickname();
                console.log('✅ [ChatRoomPage] 현재 사용자 닉네임:', currentUserNickname.current);

                console.log('✅ 방 정보 로드 완료:', detail);
            } catch (err) {
                console.error('❌ 방 정보 로드 실패:', err);
                alert('방 정보를 불러올 수 없습니다.');
                navigate('/community');
            } finally {
                setLoading(false);
            }
        };

        loadRoomDetail();
    }, [navigate]);

    // ✅ FIXED: OpenVidu 연결 - connect, disconnect를 dependency에서 제거
    useEffect(() => {
        if (roomDetail && !connected && !connecting) {
            console.log('🔌 OpenVidu 연결 시도...');
            connect();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomDetail, connected, connecting]);

    // ✅ 컴포넌트 unmount 시에만 연결 해제
    useEffect(() => {
        return () => {
            console.log('🔌 [ChatRoomPage] Unmount - 연결 해제');
            disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 메시지 스크롤 자동 이동
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 메시지 전송
    const handleSendMessage = useCallback(async () => {
        if (!inputMessage.trim() || !roomDetail) {
            return;
        }

        try {
            console.log('📤 메시지 전송 시작:', inputMessage);

            // 1. 백엔드에 저장 (ChatMessageRequest 형식)
            await sendChatMessage({
                openviduSessionId: roomDetail.openviduSessionId,
                sender: currentUserNickname.current,
                message: inputMessage,
                type: 'chat',
            });
            console.log('✅ 메시지 DB 저장 완료');

            // 2. OpenVidu로 실시간 전송
            sendOpenViduMessage(inputMessage);
            console.log('✅ OpenVidu 전송 완료');

            // 입력창 초기화
            setInputMessage('');
        } catch (err) {
            console.error('❌ 메시지 전송 실패:', err);
            alert('메시지 전송에 실패했습니다.');
        }
    }, [inputMessage, roomDetail, sendOpenViduMessage]);

    // 엔터키로 전송
    const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

    // ✅ 방 나가기 - leaveRoom API 호출 추가
    const handleLeaveRoom = useCallback(async () => {
        if (!roomDetail) return;

        if (window.confirm('정말 방을 나가시겠습니까?')) {
            try {
                console.log('🚪 [ChatRoomPage] 방 나가기 시작 - roomId:', roomDetail.roomId);

                // 1. OpenVidu 연결 해제
                disconnect();
                console.log('✅ [ChatRoomPage] OpenVidu 연결 해제 완료');

                // 2. 백엔드 API 호출 (DB에서 member 제거)
                await leaveRoom(roomDetail.roomId);
                console.log('✅ [ChatRoomPage] 방 나가기 API 호출 완료');

                // 3. 커뮤니티 페이지로 이동
                navigate('/community');
            } catch (err) {
                console.error('❌ [ChatRoomPage] 방 나가기 실패:', err);
                alert('방 나가기에 실패했습니다.');
            }
        }
    }, [roomDetail, disconnect, navigate]);

    // 참여자 보기
    const handleShowParticipants = useCallback(() => {
        alert('참여자 목록 기능은 준비 중입니다.');
    }, []);

    if (loading) {
        return (
            <Container>
                <LoadingText>채팅방 정보를 불러오는 중...</LoadingText>
            </Container>
        );
    }

    if (!roomDetail) {
        return (
            <Container>
                <ErrorText>방 정보를 찾을 수 없습니다.</ErrorText>
            </Container>
        );
    }

    return (
        <Container>
            {/* 헤더 */}
            <Header>
                <HeaderLeft>
                    <RoomTitle>{roomDetail.name}</RoomTitle>
                    <RoomInfo>
                        <span>👥 참여자 {participantCount}명</span>
                        {roomDetail.isPublic ? (
                            <PublicBadge>공개방</PublicBadge>
                        ) : (
                            <PrivateBadge>비밀방</PrivateBadge>
                        )}
                    </RoomInfo>
                </HeaderLeft>
                <HeaderRight>
                    <HeaderButton onClick={handleShowParticipants}>참여자 보기</HeaderButton>
                    <LeaveButton onClick={handleLeaveRoom}>그룹 나가기</LeaveButton>
                </HeaderRight>
            </Header>

            {/* 메시지 목록 */}
            <MessagesContainer>
                {messages.length === 0 ? (
                    <EmptyState>
                        <EmptyIcon>💬</EmptyIcon>
                        <EmptyText>채팅을 시작해보세요!</EmptyText>
                    </EmptyState>
                ) : (
                    messages.map((msg) => (
                        <ChatMessage
                            key={msg.id}
                            userName={msg.userName}
                            message={msg.message}
                            createdAt={msg.createdAt}
                            isMine={msg.isMine}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </MessagesContainer>

            {/* 입력 영역 */}
            <InputArea>
                <MessageInput
                    type="text"
                    placeholder={connected ? "메시지를 입력하세요..." : "연결 중..."}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={!connected || connecting}
                />
                <SendButton onClick={handleSendMessage} disabled={!connected || connecting || !inputMessage.trim()}>
                    전송
                </SendButton>
            </InputArea>

            {/* 연결 상태 표시 */}
            {error && <ErrorBanner>{error}</ErrorBanner>}
            {connecting && <LoadingBanner>연결 중...</LoadingBanner>}
        </Container>
    );
};

export default ChatRoomPage;

// ============= Styled Components =============

const Container = styled.div`
    width: 100%;
    height: 100vh;
    background-color: #f8f8f8;
    display: flex;
    flex-direction: column;
`;

const LoadingText = styled.div`
    text-align: center;
    padding: 40px;
    color: #666666;
    font-size: 16px;
`;

const ErrorText = styled.div`
    text-align: center;
    padding: 40px;
    color: #dc0000;
    font-size: 16px;
`;

// 헤더
const Header = styled.div`
    background-color: white;
    padding: 24px 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e0e0e0;
`;

const HeaderLeft = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const RoomTitle = styled.h1`
    color: #282828;
    font-size: 20px;
    font-weight: 700;
    margin: 0;
`;

const RoomInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    color: #666666;
    font-size: 14px;
`;

const PublicBadge = styled.span`
    background-color: #e8f5e9;
    color: #2e7d32;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
`;

const PrivateBadge = styled.span`
    background-color: #fff3e0;
    color: #e65100;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
`;

const HeaderRight = styled.div`
    display: flex;
    gap: 12px;
`;

const HeaderButton = styled.button`
    padding: 10px 20px;
    background-color: white;
    color: #203c2e;
    border: 1px solid #203c2e;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background-color: #f5f5f5;
    }
`;

const LeaveButton = styled(HeaderButton)`
    background-color: #dc0000;
    color: white;
    border: none;

    &:hover {
        background-color: #c20000;
    }
`;

// 메시지 영역
const MessagesContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 24px 60px;
    display: flex;
    flex-direction: column;
    gap: 16px;

    /* 스크롤바 스타일링 */
    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: #f1f1f1;
    }

    &::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }
`;

const EmptyState = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
`;

const EmptyIcon = styled.div`
    font-size: 64px;
`;

const EmptyText = styled.div`
    color: #999999;
    font-size: 16px;
`;

// 입력 영역
const InputArea = styled.div`
    background-color: white;
    padding: 24px 60px;
    display: flex;
    gap: 12px;
    border-top: 1px solid #e0e0e0;
`;

const MessageInput = styled.input`
    flex: 1;
    padding: 16px 20px;
    background-color: #f8f8f8;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    color: #282828;
    outline: none;
    transition: all 0.2s;

    &:focus {
        border-color: #203c2e;
        background-color: white;
    }

    &::placeholder {
        color: #999999;
    }

    &:disabled {
        background-color: #f0f0f0;
        cursor: not-allowed;
    }
`;

const SendButton = styled.button`
    padding: 16px 32px;
    background-color: #203c2e;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
        background-color: #2d5a42;
    }

    &:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }
`;

// 상태 배너
const ErrorBanner = styled.div`
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #dc0000;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const LoadingBanner = styled.div`
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #fadb13;
    color: #282828;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;