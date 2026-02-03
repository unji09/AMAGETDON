/**
 * useOpenVidu - OpenVidu 세션 관리 Hook
 * 실시간 채팅을 위한 WebRTC 연결 관리
 */

import { useState, useEffect, useRef } from 'react';
import { OpenVidu, Session, Publisher, SignalEvent, ConnectionEvent } from 'openvidu-browser';
import { getOpenViduToken } from '@/api/communityApi';
import { getCurrentUserNickname } from '@/utils/jwtUtils';

// 간단한 메시지 데이터 (OpenVidu 전용)
interface SimpleMessage {
    userName: string;
    message: string;
    createdAt: string;
    isMine: boolean; // 내가 보낸 메시지인지 여부
}

interface UseOpenViduProps {
    sessionId: string | null;
    onMessageReceived: (message: SimpleMessage) => void;
    onParticipantChanged?: (count: number) => void; // 참여자 수 변경 콜백
    onSessionIdChanged?: (newSessionId: string) => void; // 새 세션 ID 콜백
}

interface UseOpenViduReturn {
    session: Session | null;
    publisher: Publisher | null;
    connected: boolean;
    connecting: boolean;
    error: string | null;
    participantCount: number; // 현재 참여자 수
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

    // 참여자 수 업데이트 (Connections 기반)
    const updateParticipantCount = (newSession: Session) => {
        // connections는 Map 객체 (remote + local)
        // newSession.connection은 내 connection
        // newSession.remoteConnections는 다른 사용자들의 connections
        const count = newSession.remoteConnections.size + 1; // +1은 나 자신
        console.log('📊 [useOpenVidu] 참여자 수 업데이트:', count);
        console.log('📊 [useOpenVidu] Remote connections:', newSession.remoteConnections.size);
        setParticipantCount(count);
        onParticipantChanged?.(count);
    };

    // 세션 연결
    const connect = async () => {
        console.log('🔗 [useOpenVidu] connect() 시작');
        console.log('🔗 [useOpenVidu] sessionId:', sessionId);

        if (!sessionId) {
            console.error('❌ [useOpenVidu] 세션 ID가 없습니다.');
            setError('세션 ID가 없습니다.');
            return;
        }

        if (connecting) {
            console.log('⏳ [useOpenVidu] 이미 연결 중입니다.');
            return;
        }

        try {
            setConnecting(true);
            setError(null);
            console.log('⏳ [useOpenVidu] 연결 시작...');

            // 현재 사용자 닉네임 가져오기
            currentUserNickname.current = getCurrentUserNickname();
            console.log('👤 [useOpenVidu] 현재 사용자 닉네임:', currentUserNickname.current);

            // ✅ 닉네임이 '알 수 없음'인 경우 localStorage 확인
            if (currentUserNickname.current === '알 수 없음') {
                const token = localStorage.getItem('accessToken');
                console.warn('⚠️ [useOpenVidu] 닉네임을 가져올 수 없습니다!');
                console.warn('⚠️ [useOpenVidu] localStorage accessToken:', token ? '존재함' : '없음');
            }

            // OpenVidu 인스턴스 생성
            OV.current = new OpenVidu();
            const newSession = OV.current.initSession();
            console.log('✅ [useOpenVidu] OpenVidu 세션 초기화 완료');

            // ✅ connectionCreated 이벤트 (새 참여자 입장)
            newSession.on('connectionCreated', (event: ConnectionEvent) => {
                console.log('👥 [useOpenVidu] 새로운 참여자 연결:', event.connection.connectionId);
                updateParticipantCount(newSession);
            });

            // ✅ connectionDestroyed 이벤트 (참여자 퇴장)
            newSession.on('connectionDestroyed', (event: ConnectionEvent) => {
                console.log('👋 [useOpenVidu] 참여자 연결 해제:', event.connection.connectionId);
                updateParticipantCount(newSession);
            });

            // 메시지 수신 이벤트
            newSession.on('signal:chat', (event: SignalEvent) => {
                console.log('📨 [useOpenVidu] signal:chat 수신:', event);

                if (!event.data) {
                    console.warn('⚠️ [useOpenVidu] 메시지 데이터가 없습니다.');
                    return;
                }

                try {
                    const data = JSON.parse(event.data) as OpenViduMessageData;

                    // ✅ CRITICAL FIX: SignalEvent.from을 사용하여 정확히 판별
                    // event.from이 undefined면 자신이 보낸 메시지
                    const isMine = !event.from || event.from.connectionId === newSession.connection.connectionId;

                    const message: SimpleMessage = {
                        userName: data.sender || '알 수 없음',
                        message: data.message || '',
                        createdAt: data.timestamp || new Date().toISOString(),
                        isMine: isMine,
                    };
                    console.log('✅ [useOpenVidu] 메시지 파싱 성공:', message);
                    console.log('👤 [useOpenVidu] isMine:', isMine, '| from:', event.from?.connectionId, '| my:', newSession.connection.connectionId);
                    onMessageReceived(message);
                } catch (err) {
                    console.error('❌ [useOpenVidu] 메시지 파싱 실패:', err);
                }
            });

            // 연결 상태 이벤트
            newSession.on('sessionDisconnected', () => {
                console.log('🔌 [useOpenVidu] 세션 연결 해제됨');
                setConnected(false);
                setSession(null);
                setPublisher(null);
                setParticipantCount(0);
            });

            // 에러 이벤트
            newSession.on('exception', (exception: { message?: string }) => {
                console.error('❌ [useOpenVidu] OpenVidu 예외 발생:', exception);
                setError(exception.message || '알 수 없는 오류');
            });

            // 백엔드에서 토큰 발급
            console.log('🎫 [useOpenVidu] 토큰 발급 요청:', sessionId);
            const response = await getOpenViduToken(sessionId);
            const token = response.token;
            const actualSessionId = response.sessionId;
            console.log('✅ [useOpenVidu] 토큰 발급 완료:', token);
            console.log('✅ [useOpenVidu] 실제 Session ID:', actualSessionId);

            // ✅ CRITICAL: 세션 ID가 변경되었으면 부모 컴포넌트에 알림
            if (actualSessionId !== sessionId) {
                console.warn('⚠️ [useOpenVidu] 세션 ID 변경 감지:', sessionId, '→', actualSessionId);
                onSessionIdChanged?.(actualSessionId);
            }

            // ✅ CRITICAL: 세션 연결 (Publisher 없이)
            console.log('🔗 [useOpenVidu] 세션 연결 시작 (Publisher 없이)...');
            await newSession.connect(token, { clientData: currentUserNickname.current });
            console.log('✅ [useOpenVidu] 세션 연결 성공');

            // ✅ CRITICAL: 상태 업데이트
            setSession(newSession);
            setPublisher(null); // Publisher는 생성하지 않음
            setConnected(true);

            // 초기 참여자 수 업데이트
            updateParticipantCount(newSession);

            console.log('🎉 [useOpenVidu] OpenVidu 세션 연결 성공!');
        } catch (err) {
            const error = err as Error;
            console.error('❌ [useOpenVidu] 연결 실패:', error);
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
            setParticipantCount(0);
            console.log('🔌 [useOpenVidu] OpenVidu 세션 연결 해제');
        }
    };

    // 메시지 전송
    const sendMessage = (message: string) => {
        if (!session || !connected) {
            console.error('❌ [useOpenVidu] 세션이 연결되지 않았습니다.');
            return;
        }

        const data: OpenViduMessageData = {
            sender: currentUserNickname.current,
            message: message,
            timestamp: new Date().toISOString(),
        };

        console.log('📤 [useOpenVidu] 메시지 전송:', data);

        session
            .signal({
                type: 'chat',
                data: JSON.stringify(data),
            })
            .then(() => {
                console.log('✅ [useOpenVidu] 메시지 전송 성공:', message);
            })
            .catch((error) => {
                console.error('❌ [useOpenVidu] 메시지 전송 실패:', error);
                setError('메시지 전송 실패');
            });
    };

    // 컴포넌트 언마운트 시 세션 해제
    useEffect(() => {
        return () => {
            // 언마운트 시 세션 해제
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