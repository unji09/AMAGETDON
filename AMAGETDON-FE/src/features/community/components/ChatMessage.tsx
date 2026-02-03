/**
 * ChatMessage - 채팅 메시지 컴포넌트
 * Figma 디자인 기반: 내 메시지(오른쪽/노란색) vs 상대 메시지(왼쪽/회색)
 */

import React from 'react';
import styled from 'styled-components';

interface ChatMessageProps {
    userName: string;
    message: string;
    createdAt: string;
    isMine: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ userName, message, createdAt, isMine }) => {
    // 시간 포맷팅 (오전/오후 HH:MM)
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const period = hours < 12 ? '오전' : '오후';
        const displayHours = hours % 12 || 12;
        return `${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
    };

    if (isMine) {
        // 내 메시지 (오른쪽, 노란색)
        return (
            <MyMessageContainer>
                <TimeText>{formatTime(createdAt)}</TimeText>
                <MyMessageBubble>
                    <MessageText>{message}</MessageText>
                </MyMessageBubble>
            </MyMessageContainer>
        );
    }

    // 상대 메시지 (왼쪽, 회색)
    return (
        <OtherMessageContainer>
            <Avatar>
                <AvatarText>{userName.charAt(0)}</AvatarText>
            </Avatar>
            <MessageContent>
                <MessageHeader>
                    <UserName>{userName}</UserName>
                    <TimeText>{formatTime(createdAt)}</TimeText>
                </MessageHeader>
                <OtherMessageBubble>
                    <MessageText>{message}</MessageText>
                </OtherMessageBubble>
            </MessageContent>
        </OtherMessageContainer>
    );
};

export default ChatMessage;

// ============= Styled Components =============

// 내 메시지 컨테이너 (오른쪽 정렬)
const MyMessageContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    gap: 8px;
    margin-bottom: 16px;
`;

// 상대 메시지 컨테이너 (왼쪽 정렬)
const OtherMessageContainer = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
`;

// 아바타
const Avatar = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #203c2e;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
`;

const AvatarText = styled.span`
    color: white;
    font-size: 16px;
    font-weight: 700;
`;

// 메시지 내용 영역
const MessageContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 700px;
`;

// 메시지 헤더 (이름 + 시간)
const MessageHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

// 사용자 이름
const UserName = styled.span`
    color: #282828;
    font-size: 15px;
    font-weight: 700;
`;

// 시간
const TimeText = styled.span`
    color: #999999;
    font-size: 13px;
    font-weight: 400;
`;

// 내 메시지 말풍선 (노란색)
const MyMessageBubble = styled.div`
    background-color: #fadb13;
    padding: 12px 16px;
    border-radius: 8px;
    max-width: 856px;
    word-wrap: break-word;
`;

// 상대 메시지 말풍선 (회색)
const OtherMessageBubble = styled.div`
    background-color: #f8f8f8;
    padding: 12px 16px;
    border-radius: 8px;
    word-wrap: break-word;
`;

// 메시지 텍스트
const MessageText = styled.p`
    color: #282828;
    font-size: 16px;
    font-weight: 400;
    margin: 0;
    line-height: 1.5;
    white-space: pre-wrap;
`;