package com.amagetdon.community.service;

import com.amagetdon.community.dto.GroupCreateRequestDto;
import com.amagetdon.community.entity.Group;
import com.amagetdon.community.repository.GroupRepository;
import io.openvidu.java.client.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final OpenVidu openVidu;
    private final GroupRepository groupRepository;

    @Transactional
    public String createGroup(Long ownerId, GroupCreateRequestDto request)
    throws OpenViduJavaClientException, OpenViduHttpException {

        if(groupRepository.existsByOwnerId(ownerId)){
            throw new IllegalStateException("이미 참여 중이거나 생성한 그룹이 있습니다.");
        }

        SessionProperties properties = new SessionProperties.Builder().build();
        Session session = openVidu.createSession(properties);

        Group group = Group.builder().
                ownerId(ownerId).
                name(request.getName()).
                maxMemberCount(request.getMaxMemberCount())
                .isPublic(request.getIsPublic())
                .joinCode(request.getJoinCode())
                .openviduSessionId(session.getSessionId())
                .currentMemberCount(1) //방장은 즉시 참여하므로 기본 값 1로 설정
                .build();

        groupRepository.save(group);

        return session.getSessionId();

    }
}
