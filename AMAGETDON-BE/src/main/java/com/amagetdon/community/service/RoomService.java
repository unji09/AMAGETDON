package com.amagetdon.community.service;

import com.amagetdon.common.ErrorCode;
import com.amagetdon.community.dto.MemberResponseDto;
import com.amagetdon.community.dto.RoomCreateRequestDto;
import com.amagetdon.community.dto.RoomResponseDto;
import com.amagetdon.community.entity.Member;
import com.amagetdon.community.entity.Room;
import com.amagetdon.community.repository.MemberRepository;
import com.amagetdon.community.repository.RoomRepository;
import io.openvidu.java.client.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final OpenVidu openVidu;
    private final RoomRepository roomRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public RoomResponseDto createGroup(Long ownerId, RoomCreateRequestDto request)
    throws OpenViduJavaClientException, OpenViduHttpException {

        memberRepository.findByUserIdAndIsActiveTrue(ownerId)
                .ifPresent(member -> {
                    throw new IllegalStateException("이미 참여 중이거나 생성한 그룹이 있습니다.");
                });

        SessionProperties properties = new SessionProperties.Builder().build();
        Session session = openVidu.createSession(properties);

        Room room = Room.builder().
                ownerId(ownerId).
                name(request.getName()).
                maxMemberCount(request.getMaxMemberCount())
                .isPublic(request.getIsPublic())
                .joinCode(request.getJoinCode())
                .openviduSessionId(session.getSessionId())
                .currentMemberCount(1) //방장은 즉시 참여하므로 기본 값 1로 설정
                .createdAt(LocalDateTime.now())
                .build();

        Room savedRoom = roomRepository.save(room);

        Member ownerMember = Member.builder()
                .roomId(savedRoom.getId())
                .userId(ownerId)
                .build();
        memberRepository.save(ownerMember);

        return RoomResponseDto.builder()
                .roomId(savedRoom.getId())
                .name(savedRoom.getName())
                .openviduSessionId(savedRoom.getOpenviduSessionId())
                .currentMemberCount(savedRoom.getCurrentMemberCount())
                .maxMemberCount(savedRoom.getMaxMemberCount())
                .isPublic(savedRoom.getIsPublic())
                .joinCode(savedRoom.getJoinCode())
                .createdAt(LocalDateTime.now())
                .build();

    }

    public Page<RoomResponseDto> getPublicRooms(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Room> rooms = roomRepository.findByIsPublicTrue(pageable);

        return rooms.map(room -> RoomResponseDto.builder()
                .roomId(room.getId())
                .name(room.getName())
                .currentMemberCount(room.getCurrentMemberCount())
                .maxMemberCount(room.getMaxMemberCount())
                .isPublic(room.getIsPublic())
                .build());
    }

    // 공개 그룹 참여
    @Transactional
    public MemberResponseDto joinPublicRoom(Long userId, Long roomId) {

        // 이미 참여 중인 그룹이 있는지 확인
        memberRepository.findByUserIdAndIsActiveTrue(userId)
                .ifPresent(member -> {
                    throw new IllegalArgumentException(ErrorCode.ALREADY_JOINED_ROOM.getMessage());
                });

        // 그룹이 존재하는지 확인
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException(ErrorCode.ROOM_NOT_FOUND.getMessage()));

        // 공개 그룹인지 확인
        if(!room.getIsPublic()) {
            throw new IllegalArgumentException(ErrorCode.PRIVATE_ROOM_ACCESS_DENIED.getMessage());
        }

        // 중복 참여 확인
        memberRepository.findByRoomIdAndUserIdAndIsActiveTrue(roomId, userId)
                .ifPresent(member -> {
                    throw new IllegalArgumentException(ErrorCode.ALREADY_JOINED_ROOM.getMessage());
                });

        // 정원 초과 확인
        long currentMemberCount = memberRepository.countByRoomIdAndIsActiveTrue(roomId);
        if (currentMemberCount >= room.getMaxMemberCount()) {
            throw new IllegalArgumentException(ErrorCode.ROOM_FULL.getMessage());
        }

        // 멤버 생성
        Member newMember = Member.builder()
                .roomId(roomId)
                .userId(userId)
                .build();

        Member savedMember = memberRepository.save(newMember);

        room.incrementCurrentMemberCount();

        return MemberResponseDto.builder()
                .memberId(savedMember.getId())
                .roomId(savedMember.getRoomId())
                .userId(savedMember.getUserId())
                .isActive(savedMember.getIsActive())
                .build();

    }

    // 비밀 그룹 참여
    @Transactional
    public MemberResponseDto joinPrivateRoom(Long userId, String joinCode) {
        // 1. 참여코드로 방 찾기
        Room room = roomRepository.findByJoinCode(joinCode)
                .orElseThrow(() -> new IllegalArgumentException(ErrorCode.INVALID_JOIN_CODE.getMessage()));

        // 2. 공개방 검증
        if (room.getIsPublic()) {
            throw new IllegalArgumentException(ErrorCode.PRIVATE_ROOM_ACCESS_DENIED.getMessage());
        }

        // 3. 1인 1그룹 검증 (기존 패턴 사용)
        memberRepository.findByUserIdAndIsActiveTrue(userId)
                .ifPresent(member -> {
                    throw new IllegalArgumentException(ErrorCode.ALREADY_JOINED_ROOM.getMessage());
                });

        // 4. 정원 체크
        if (room.getCurrentMemberCount() >= room.getMaxMemberCount()) {
            throw new IllegalArgumentException(ErrorCode.ROOM_FULL.getMessage());
        }

        Member member = Member.builder()
                .userId(userId)
                .roomId(room.getId())
                .isActive(true)
                .build();

        Member savedMember = memberRepository.save(member);

        room.incrementCurrentMemberCount();

        return MemberResponseDto.builder()
                .memberId(savedMember.getId())
                .roomId(room.getId())
                .userId(userId)
                .isActive(true)
                .build();
    }
}
