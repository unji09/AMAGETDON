package com.amagetdon.community.service;

import com.amagetdon.achievement.repository.AchievementRedisRepository;
import com.amagetdon.achievement.service.AchievementService;
import com.amagetdon.common.ErrorCode;
import com.amagetdon.community.dto.response.*;
import com.amagetdon.community.dto.request.RoomCreateRequestDto;
import com.amagetdon.community.entity.Member;
import com.amagetdon.community.entity.Room;
import com.amagetdon.community.repository.MemberRepository;
import com.amagetdon.community.repository.RoomRepository;
import com.amagetdon.user.dto.response.UserResponseDto;
import com.amagetdon.user.service.UserService;
import io.openvidu.java.client.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.amagetdon.achievement.entity.AchievementIdCode.I_AM_GROOVE;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final OpenVidu openVidu;
    private final RoomRepository roomRepository;
    private final MemberRepository memberRepository;
    private final ChatMessageService chatMessageService;
    private final UserService userService;
    private final AchievementService achievementService;
    private final AchievementRedisRepository achievementRedisRepository;

    @Transactional
    public RoomResponseDto createGroup(Long ownerId, RoomCreateRequestDto request)
            throws OpenViduJavaClientException, OpenViduHttpException {

        memberRepository.findByUserIdAndIsActiveTrue(ownerId)
                .ifPresent(member -> {
                    throw new IllegalArgumentException(ErrorCode.ALREADY_JOINED_ROOM.getMessage());
                });

        SessionProperties properties = new SessionProperties.Builder().build();
        Session session = openVidu.createSession(properties);

        Room room = Room.builder()
                .ownerId(ownerId)
                .name(request.getName())
                .maxMemberCount(request.getMaxMemberCount())
                .isPublic(request.getIsPublic())
                .joinCode(request.getJoinCode())
                .openviduSessionId(session.getSessionId())
                .currentMemberCount(1)
                .build();

        Room savedRoom = roomRepository.save(room);

        Member ownerMember = Member.builder()
                .roomId(savedRoom.getId())
                .userId(ownerId)
                .build();
        memberRepository.save(ownerMember);

        Long createCount = achievementRedisRepository.increment(ownerId, "create_room_count");
        achievementService.checkAndAwardAchievements(ownerId, createCount, I_AM_GROOVE);

        return RoomResponseDto.builder()
                .roomId(savedRoom.getId())
                .name(savedRoom.getName())
                .openviduSessionId(savedRoom.getOpenviduSessionId())
                .currentMemberCount(savedRoom.getCurrentMemberCount())
                .maxMemberCount(savedRoom.getMaxMemberCount())
                .isPublic(savedRoom.getIsPublic())
                .joinCode(savedRoom.getJoinCode())
                .createdAt(savedRoom.getCreatedAt())
                .build();
    }

    public Page<RoomResponseDto> getPublicRooms(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Room> rooms;

        if (search != null && !search.trim().isEmpty()) {
            rooms = roomRepository.findByNameContainingIgnoreCaseAndIsPublicTrue(search.trim(), pageable);
        } else {
            rooms = roomRepository.findByIsPublicTrue(pageable);
        }

        return rooms.map(room -> RoomResponseDto.builder()
                .roomId(room.getId())
                .name(room.getName())
                .currentMemberCount(room.getCurrentMemberCount())
                .maxMemberCount(room.getMaxMemberCount())
                .isPublic(room.getIsPublic())
                .createdAt(room.getCreatedAt())
                .build());
    }

    @Transactional
    public MemberResponseDto joinPublicRoom(Long userId, Long roomId) {
        memberRepository.findByUserIdAndIsActiveTrue(userId)
                .ifPresent(member -> {
                    throw new IllegalArgumentException(ErrorCode.ALREADY_JOINED_ROOM.getMessage());
                });

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException(ErrorCode.ROOM_NOT_FOUND.getMessage()));

        if (!room.getIsPublic()) {
            throw new IllegalArgumentException(ErrorCode.PRIVATE_ROOM_ACCESS_DENIED.getMessage());
        }

        memberRepository.findByRoomIdAndUserIdAndIsActiveTrue(roomId, userId)
                .ifPresent(member -> {
                    throw new IllegalArgumentException(ErrorCode.ALREADY_JOINED_ROOM.getMessage());
                });

        long currentMemberCount = memberRepository.countByRoomIdAndIsActiveTrue(roomId);
        if (currentMemberCount >= room.getMaxMemberCount()) {
            throw new IllegalArgumentException(ErrorCode.ROOM_FULL.getMessage());
        }

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

    @Transactional
    public MemberResponseDto joinPrivateRoom(Long userId, String joinCode) {
        Room room = roomRepository.findByJoinCode(joinCode)
                .orElseThrow(() -> new IllegalArgumentException(ErrorCode.INVALID_JOIN_CODE.getMessage()));

        if (room.getIsPublic()) {
            throw new IllegalArgumentException(ErrorCode.PRIVATE_ROOM_ACCESS_DENIED.getMessage());
        }

        memberRepository.findByUserIdAndIsActiveTrue(userId)
                .ifPresent(member -> {
                    throw new IllegalArgumentException(ErrorCode.ALREADY_JOINED_ROOM.getMessage());
                });

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

    @Transactional
    public RoomLeaveResponseDto leaveRoom(Long userId, Long roomId) {
        // ✅ orElseThrow 대신 Optional로 체크
        Optional<Member> memberOpt = memberRepository.findByUserIdAndRoomIdAndIsActiveTrue(userId, roomId);

        // ✅ 이미 나간 사용자 → 에러 대신 성공 반환
        if (memberOpt.isEmpty()) {
            return RoomLeaveResponseDto.builder()
                    .roomId(roomId)
                    .isRoomDeleted(false)
                    .leftAt(LocalDateTime.now())
                    .build();
        }

        // 아래는 원본 로직 그대로
        Member member = memberOpt.get();

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException(ErrorCode.ROOM_NOT_FOUND.getMessage()));

        // Hard Delete (unique constraint 위반 방지)
        memberRepository.delete(member);
        room.decrementCurrentMemberCount();

        boolean isRoomDeleted = false;
        if (room.isEmpty()) {
            chatMessageService.deleteMessages(roomId);
            roomRepository.delete(room);
            isRoomDeleted = true;
        } else {
            roomRepository.save(room);
        }

        return RoomLeaveResponseDto.builder()
                .roomId(roomId)
                .isRoomDeleted(isRoomDeleted)
                .leftAt(LocalDateTime.now())
                .build();
    }

    public RoomResponseDto getMyRoom(Long userId) {
        Optional<Member> memberOpt = memberRepository.findByUserIdAndIsActiveTrue(userId);

        if (memberOpt.isEmpty()) {
            return null;
        }

        Member member = memberOpt.get();
        Room room = roomRepository.findById(member.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException(ErrorCode.ROOM_NOT_FOUND.getMessage()));

        return RoomResponseDto.builder()
                .roomId(room.getId())
                .name(room.getName())
                .currentMemberCount(room.getCurrentMemberCount())
                .maxMemberCount(room.getMaxMemberCount())
                .isPublic(room.getIsPublic())
                .joinCode(room.getJoinCode())
                .openviduSessionId(room.getOpenviduSessionId())
                .createdAt(room.getCreatedAt())
                .build();
    }

    public RoomMemberListResponseDto getMembers(Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException(ErrorCode.ROOM_NOT_FOUND.getMessage()));

        List<Member> members = memberRepository.findByRoomIdAndIsActiveTrueOrderByJoinedAtDesc(roomId);

        List<RoomMemberDto> memberDtos = members.stream()
                .map(member -> {
                    UserResponseDto user = userService.getUserInfo(member.getUserId());
                    return RoomMemberDto.builder()
                            .memberId(member.getId())
                            .userId(member.getUserId())
                            .nickname(user.nickname())
                            .joinedAt(member.getJoinedAt())
                            .isOwner(member.getUserId().equals(room.getOwnerId()))
                            .build();
                })
                .collect(Collectors.toList());

        return RoomMemberListResponseDto.builder()
                .roomId(room.getId())
                .roomName(room.getName())
                .totalMembers(memberDtos.size())
                .members(memberDtos)
                .build();
    }
}