/**
 * useOpenVidu - OpenVidu 세션 관리 Hook
 * 실시간 채팅을 위한 WebRTC 연결 관리
 */

import { useState, useEffect, useRef } from 'react';
import { OpenVidu, Session, Publisher, SignalEvent } from 'openvidu-browser';
import { getOpenViduToken } from '@/api/communityApi';
import { getCurrentUserNickname } from '@/utils/jwtUtils';

interface SimpleMessage {
    userName: string;
    message: string;
    createdAt: string;
    isMine: boolean;
}

interface UseOpenViduProps {
    sessionId: string | null;
    onMessageReceived: (message: SimpleMessage) => void;
    onParticipantChanged?: (count: number) => void;
    onSessionIdChanged?: (newSessionId: string) => void;
}

interface UseOpenViduReturn {
    session: Session | null;
    publisher: Publisher | null;
    connected: boolean;
    connecting: boolean;
    error: string | null;
    participantCount: number;
    connect: () => Promise<void>;
    disconnect: () => void;
    sendMessage: (message: string) => void;
}

interface OpenViduMessageData {
    sender: string;
    message: string;
    timestamp: string;
}

export const useOpenVidu = ({
                                sessionId,
                                onMessageReceived,
                                onParticipantChanged,
                                onSessionIdChanged
                            }: UseOpenViduProps): UseOpenViduReturn => {
    const [session, setSession] = useState<Session | null>(null);
    const [publisher, setPublisher] = useState<Publisher | null>(null);
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [participantCount, setParticipantCount] = useState(0);

    const OV = useRef<OpenVidu | null>(null);
    const currentUserNickname = useRef<string>('');

    const updateParticipantCount = (newSession: Session) => {
        const count = newSession.remoteConnections.size + 1;
        setParticipantCount(count);
        onParticipantChanged?.(count);
    };

    const connect = async () => {
        if (!sessionId) {
            setError('세션 ID가 없습니다.');
            return;
        }

        if (connecting) return;

        try {
            setConnecting(true);
            setError(null);

            currentUserNickname.current = getCurrentUserNickname();

            OV.current = new OpenVidu();
            const newSession = OV.current.initSession();

            // 참여자 입장 이벤트
            newSession.on('connectionCreated', () => {
                updateParticipantCount(newSession);
            });

            // 참여자 퇴장 이벤트
            newSession.on('connectionDestroyed', () => {
                updateParticipantCount(newSession);
            });

            // 메시지 수신 이벤트
            newSession.on('signal:chat', (event: SignalEvent) => {
                if (!event.data) return;

                try {
                    const data = JSON.parse(event.data) as OpenViduMessageData;
                    const isMine = !event.from || event.from.connectionId === newSession.connection.connectionId;

                    const message: SimpleMessage = {
                        userName: data.sender || '알 수 없음',
                        message: data.message || '',
                        createdAt: data.timestamp || new Date().toISOString(),
                        isMine: isMine,
                    };
                    onMessageReceived(message);
                } catch (err) {
                    console.error('메시지 파싱 실패:', err);
                }
            });

            // 세션 연결 해제 이벤트
            newSession.on('sessionDisconnected', () => {
                setConnected(false);
                setSession(null);
                setPublisher(null);
                setParticipantCount(0);
            });

            // 에러 이벤트
            newSession.on('exception', (exception: { message?: string }) => {
                setError(exception.message || '알 수 없는 오류');
            });

            // 백엔드에서 토큰 발급
            const response = await getOpenViduToken(sessionId);
            const token = response.token;
            const actualSessionId = response.sessionId;

            // 세션 ID가 변경되었으면 부모 컴포넌트에 알림
            if (actualSessionId !== sessionId) {
                onSessionIdChanged?.(actualSessionId);
            }

            // 세션 연결
            await newSession.connect(token, { clientData: currentUserNickname.current });

            setSession(newSession);
            setPublisher(null);
            setConnected(true);
            updateParticipantCount(newSession);
        } catch (err) {
            const error = err as Error;
            setError(error.message || 'OpenVidu 연결에 실패했습니다.');
            setConnected(false);
        } finally {
            setConnecting(false);
        }
    };

    const disconnect = () => {
        if (session) {
            session.disconnect();
            setSession(null);
            setPublisher(null);
            setConnected(false);
            setParticipantCount(0);
        }
    };

    const sendMessage = (message: string) => {
        if (!session || !connected) return;

        const data: OpenViduMessageData = {
            sender: currentUserNickname.current,
            message: message,
            timestamp: new Date().toISOString(),
        };

        session
            .signal({
                type: 'chat',
                data: JSON.stringify(data),
            })
            .catch(() => {
                setError('메시지 전송 실패');
            });
    };

    useEffect(() => {
        return () => {
            if (session) {
                session.disconnect();
            }
        };
    }, [session]);

    return {
        session,
        publisher,
        connected,
        connecting,
        error,
        participantCount,
        connect,
        disconnect,
        sendMessage,
    };
};