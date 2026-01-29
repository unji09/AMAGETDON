package com.amagetdon.community.service;

import com.amagetdon.community.dto.RoomCreateRequestDto;
import com.amagetdon.community.dto.RoomResponseDto;
import com.amagetdon.community.entity.Room;
import com.amagetdon.community.repository.RoomRepository;
import io.openvidu.java.client.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final OpenVidu openVidu;
    private final RoomRepository roomRepository;

    @Transactional
    public RoomResponseDto createGroup(Long ownerId, RoomCreateRequestDto request)
    throws OpenViduJavaClientException, OpenViduHttpException {

        if(roomRepository.existsByOwnerId(ownerId)){
            throw new IllegalStateException("이미 참여 중이거나 생성한 그룹이 있습니다.");
        }

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

        return RoomResponseDto.builder()
                .roomId(savedRoom.getId())
                .name(savedRoom.getName())
                .openviduSessionId(savedRoom.getOpenviduSessionId())
                .build();

    }
}
