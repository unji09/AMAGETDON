import apiClient from './client';
import type {
    RoomCreateRequest,
    RoomResponse,
    JoinPrivateRoomRequest,
    MemberResponse,
    RoomLeaveResponse,
    RoomMemberListResponse,
    PublicRoomsResponse,
    MyRoomResponse,
    ChatMessage,
    ChatMessageRequest,
    ChatMessagesResponse,
} from '@/features/community/types/CommunityTypes';

// 그룹 관리 API

export const createRoom = async (data: RoomCreateRequest): Promise<RoomResponse> => {
    const response = await apiClient.post<{ data: RoomResponse }>('/community/rooms', data);
    return response.data.data;
};

export const getPublicRooms = async (
    search?: string,
    page: number = 0,
    size: number = 10
): Promise<PublicRoomsResponse> => {
    const params: { page: number; size: number; search?: string } = { page, size };
    if (search) {
        params.search = search;
    }
    const response = await apiClient.get<{ data: PublicRoomsResponse }>('/community/rooms', { params });
    return response.data.data;
};

export const getMyRoom = async (): Promise<RoomResponse | null> => {
    const response = await apiClient.get<{ data: MyRoomResponse }>('/community/rooms/myRooms');
    return response.data.data.room;
};

export const joinPublicRoom = async (roomId: number): Promise<MemberResponse> => {
    const response = await apiClient.post<{ data: MemberResponse }>(`/community/rooms/${roomId}/join`);
    return response.data.data;
};

export const joinPrivateRoom = async (data: JoinPrivateRoomRequest): Promise<MemberResponse> => {
    const response = await apiClient.post<{ data: MemberResponse }>('/community/rooms/joinPrivate', data);
    return response.data.data;
};

export const leaveRoom = async (roomId: number): Promise<RoomLeaveResponse> => {
    const response = await apiClient.delete<{ data: RoomLeaveResponse }>(`/community/rooms/${roomId}/leave`);
    return response.data.data;
};

export const getRoomMembers = async (roomId: number): Promise<RoomMemberListResponse> => {
    const response = await apiClient.get<{ data: RoomMemberListResponse }>(`/community/rooms/${roomId}/members`);
    return response.data.data;
};

// 채팅 API

export const sendChatMessage = async (data: ChatMessageRequest): Promise<void> => {
    await apiClient.post('/chat/send', data);
};

export const getChatMessages = async (roomId: number): Promise<ChatMessage[]> => {
    const response = await apiClient.get<ChatMessagesResponse>(`/chat/messages/${roomId}`);
    return response.data.data;
};

/**
 * 읽지 않은 메시지 수 조회
 */
export const getUnreadCount = async (roomId: number): Promise<{ unreadCount: number }> => {
    const response = await apiClient.get(`/chat/unread/${roomId}`);
    const raw = response.data;

    console.log('[communityApi] getUnreadCount raw response:', raw);

    // 다양한 응답 형식 파싱
    if (typeof raw === 'number') {
        return { unreadCount: raw };
    }
    if (raw && typeof raw === 'object') {
        if (typeof raw.unreadCount === 'number') {
            return { unreadCount: raw.unreadCount };
        }
        if (raw.data && typeof raw.data === 'number') {
            return { unreadCount: raw.data };
        }
        if (raw.data && typeof raw.data === 'object' && typeof raw.data.unreadCount === 'number') {
            return { unreadCount: raw.data.unreadCount };
        }
    }

    return { unreadCount: 0 };
};

export const markAsRead = async (roomId: number): Promise<void> => {
    await apiClient.post(`/chat/read/${roomId}`);
};

// OpenVidu API

export const getOpenViduToken = async (sessionId: string): Promise<{ token: string; sessionId: string }> => {
    const response = await apiClient.post<{ token: string; sessionId: string }>(`/sessions/${sessionId}/connections`, {});
    return response.data;
};