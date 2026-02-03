/**
 * 커뮤니티 관련 타입 정의
 */

// 그룹 생성 요청 DTO
export interface RoomCreateRequest {
    name: string;
    maxMemberCount: number;
    isPublic: boolean;
    joinCode?: string;
}

// 비밀 그룹 참여 요청 DTO
export interface JoinPrivateRoomRequest {
    joinCode: string;
}

// 그룹 응답 DTO
export interface RoomResponse {
    roomId: number;
    name: string;
    openviduSessionId: string;
    currentMemberCount: number;
    maxMemberCount: number;
    isPublic: boolean;
    joinCode?: string;
    createdAt: string;
}

// 멤버 응답 DTO
export interface MemberResponse {
    memberId: number;
    roomId: number;
    userId: number;
    isActive: boolean;
}

// 그룹 나가기 응답 DTO
export interface RoomLeaveResponse {
    roomId: number;
    isRoomDeleted: boolean;
    leftAt: string;
}

// 그룹 참여자 DTO
export interface RoomMemberDto {
    memberId: number;
    userId: number;
    nickname: string;
    joinedAt: string;
    isOwner: boolean;
}

// 그룹 참여자 목록 응답 DTO
export interface RoomMemberListResponse {
    roomId: number;
    roomName: string;
    totalMembers: number;
    members: RoomMemberDto[];
}

// 공개 그룹 목록 조회 응답
export interface PublicRoomsResponse {
    rooms: RoomResponse[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

// 내가 속한 그룹 조회 응답
export interface MyRoomResponse {
    room: RoomResponse | null;
}

// 채팅 메시지 DTO
export interface ChatMessage {
    roomId: number;
    userId: number;
    userName: string;
    message: string;
    type: string;
    createdAt: string;
}

// 채팅 메시지 전송 요청 DTO
export interface ChatMessageRequest {
    openviduSessionId: string;
    sender: string;
    message: string;
    type: string;
}

// 채팅 메시지 조회 응답
export interface ChatMessagesResponse {
    data: ChatMessage[];
}

// OpenVidu 세션 생성 응답
export interface OpenViduSessionResponse {
    sessionId: string;
}

// OpenVidu 커넥션 생성 응답
export interface OpenViduConnectionResponse {
    token: string;
}