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
import com.amagetdon.user.entity.User;
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

import static com.amagetdon.achievement.entity.AchievementIdCode.I_AM_GROOVE;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final OpenVidu openVidu;
    private final RoomRepository roomRepository;
    private final MemberRepository memberRepository;
    private final ChatMessageService chatMessageService;
    private final UserService userService;

    // 업적 관련
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

        Room room = Room.builder().
                ownerId(ownerId).
                name(request.getName()).
                maxMemberCount(request.getMaxMemberCount())
                .isPublic(request.getIsPublic())
                .joinCode(request.getJoinCode())
                .openviduSessionId(session.getSessionId())
                .currentMemberCount(1) //방장은 즉시 참여하므로 기본 값 1로 설정
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

    // 그룹 검색 기능 추가
    public Page<RoomResponseDto> getPublicRooms(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Room> rooms;

        if(search != null && !search.trim().isEmpty()) {
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
        // 참여코드로 방 찾기
        Room room = roomRepository.findByJoinCode(joinCode)
                .orElseThrow(() -> new IllegalArgumentException(ErrorCode.INVALID_JOIN_CODE.getMessage()));

        // 공개방 검증
        if (room.getIsPublic()) {
            throw new IllegalArgumentException(ErrorCode.PRIVATE_ROOM_ACCESS_DENIED.getMessage());
        }

        // 1인 1그룹 검증
        memberRepository.findByUserIdAndIsActiveTrue(userId)
                .ifPresent(member -> {
                    throw new IllegalArgumentException(ErrorCode.ALREADY_JOINED_ROOM.getMessage());
                });

        // 정원 체크
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

    // 방 나가기
    @Transactional
    public RoomLeaveResponseDto leaveRoom(Long userId, Long roomId) {

        // Member 찾기
        Member member = memberRepository.findByUserIdAndRoomIdAndIsActiveTrue(userId, roomId)
                .orElseThrow(() -> new IllegalArgumentException(ErrorCode.NOT_ROOM_MEMBER.getMessage()));

        // Room 찾기
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException(ErrorCode.ROOM_NOT_FOUND.getMessage()));

        member.deactivate();
        memberRepository.save(member);

        room.decrementCurrentMemberCount();

        // 인원이 0명이면 삭제
        boolean isRoomDeleted = false;
        if(room.isEmpty()) {
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

    // 내가 속한 그룹 조회
    public RoomResponseDto getMyRoom(Long userId) {

        Optional<Member> memberOpt =  memberRepository.findByUserIdAndIsActiveTrue(userId);

        if(memberOpt.isEmpty()) {
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

    // 그룹 참여자 목록 조회
    public RoomMemberListResponseDto getMembers(Long roomId) {

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException(ErrorCode.ROOM_NOT_FOUND.getMessage()));

        List<Member> members = memberRepository.findByRoomIdAndIsActiveTrueOrderByJoinedAtDesc(roomId);

        List<RoomMemberDto> memberDtos = members.stream()
                .map(member -> {

                    User user = userService.getUserInfo(member.getUserId());
                    String nickname = user.getNickname();

                    return RoomMemberDto.builder()
                            .memberId(member.getId())
                            .userId(member.getUserId())
                            .nickname(nickname)
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
