/**
 * useOpenVidu - OpenVidu 세션 관리 Hook
 * 실시간 채팅을 위한 WebRTC 연결 관리
 */

import { useState, useEffect, useRef } from 'react';
import { OpenVidu, Session, Publisher, SignalEvent } from 'openvidu-browser';
import { getOpenViduToken } from '@/api/communityApi';

// 간단한 메시지 데이터 (OpenVidu 전용)
interface SimpleMessage {
    userName: string;
    message: string;
    createdAt: string;
}

interface UseOpenViduProps {
    sessionId: string | null;
    onMessageReceived: (message: SimpleMessage) => void;
}

interface UseOpenViduReturn {
    session: Session | null;
    publisher: Publisher | null;
    connected: boolean;
    connecting: boolean;
    error: string | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    sendMessage: (message: string) => void;
}

// OpenVidu 메시지 데이터 타입
interface OpenViduMessageData {
    sender: string;
    message: string;
    timestamp: string;
}

export const useOpenVidu = ({ sessionId, onMessageReceived }: UseOpenViduProps): UseOpenViduReturn => {
    const [session, setSession] = useState<Session | null>(null);
    const [publisher, setPublisher] = useState<Publisher | null>(null);
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const OV = useRef<OpenVidu | null>(null);

    // 세션 연결
    const connect = async () => {
        if (!sessionId) {
            console.error('세션 ID가 없습니다.');
            setError('세션 ID가 없습니다.');
            return;
        }

        if (connecting) {
            console.log('이미 연결 중입니다.');
            return;
        }

        try {
            setConnecting(true);
            setError(null);

            // OpenVidu 인스턴스 생성
            OV.current = new OpenVidu();
            const newSession = OV.current.initSession();

            // 메시지 수신 이벤트
            newSession.on('signal:chat', (event: SignalEvent) => {
                if (!event.data) {
                    console.warn('메시지 데이터가 없습니다.');
                    return;
                }

                try {
                    const data = JSON.parse(event.data) as OpenViduMessageData;
                    const message: SimpleMessage = {
                        userName: data.sender || '알 수 없음',
                        message: data.message || '',
                        createdAt: data.timestamp || new Date().toISOString(),
                    };
                    onMessageReceived(message);
                } catch (err) {
                    console.error('메시지 파싱 실패:', err);
                }
            });

            // 연결 상태 이벤트
            newSession.on('sessionDisconnected', () => {
                console.log('세션 연결 해제됨');
                setConnected(false);
                setSession(null);
                setPublisher(null);
            });

            // 에러 이벤트
            newSession.on('exception', (exception: { message?: string }) => {
                console.error('OpenVidu 예외 발생:', exception);
                setError(exception.message || '알 수 없는 오류');
            });

            // 백엔드에서 토큰 발급
            console.log('토큰 발급 요청:', sessionId);
            const token = await getOpenViduToken(sessionId);
            console.log('토큰 발급 완료');

            // 세션 연결
            await newSession.connect(token, { clientData: '사용자' });
            console.log('세션 연결 성공');

            // Publisher 생성 (영상 없이 데이터만)
            const newPublisher = await OV.current.initPublisherAsync(undefined, {
                audioSource: false,
                videoSource: false,
                publishAudio: false,
                publishVideo: false,
            });

            // Publisher 게시
            await newSession.publish(newPublisher);
            console.log('Publisher 게시 완료');

            setSession(newSession);
            setPublisher(newPublisher);
            setConnected(true);

            console.log('OpenVidu 세션 연결 성공:', sessionId);
        } catch (err) {
            const error = err as Error;
            console.error('OpenVidu 연결 실패:', error);
            setError(error.message || 'OpenVidu 연결에 실패했습니다.');
            setConnected(false);
        } finally {
            setConnecting(false);
        }
    };

    // 세션 연결 해제
    const disconnect = () => {
        if (session) {
            session.disconnect();
            setSession(null);
            setPublisher(null);
            setConnected(false);
            console.log('OpenVidu 세션 연결 해제');
        }
    };

    // 메시지 전송
    const sendMessage = (message: string) => {
        if (!session || !connected) {
            console.error('세션이 연결되지 않았습니다.');
            return;
        }

        const data: OpenViduMessageData = {
            sender: '현재 사용자', // TODO: 실제 사용자 이름
            message: message,
            timestamp: new Date().toISOString(),
        };

        session
            .signal({
                type: 'chat',
                data: JSON.stringify(data),
            })
            .then(() => {
                console.log('메시지 전송 성공:', message);
            })
            .catch((error) => {
                console.error('메시지 전송 실패:', error);
                setError('메시지 전송 실패');
            });
    };

    // 컴포넌트 언마운트 시 세션 해제
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    return {
        session,
        publisher,
        connected,
        connecting,
        error,
        connect,
        disconnect,
        sendMessage,
    };
};