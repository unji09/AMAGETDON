package com.amagetdon.community.service;

import com.amagetdon.common.ErrorCode;
import com.amagetdon.community.dto.ChatMessage;
import com.amagetdon.community.entity.Member;
import com.amagetdon.community.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final MemberRepository memberRepository;

    private static final String CHAT_MESSAGE_KEY_PREFIX = "chat_messages:";
    private static final Duration MESSAGE_TTL = Duration.ofHours(24);

    // 채팅 메시지를 Redis에 저장
    public void saveMessage(Long roomId, Long userId, String userName, String message, String type) {

        String key = CHAT_MESSAGE_KEY_PREFIX + roomId;

        ChatMessage chatMessage = ChatMessage.builder()
                .roomId(roomId)
                .userId(userId)
                .userName(userName)
                .message(message)
                .type(type)
                .createdAt(LocalDateTime.now())
                .build();

        redisTemplate.opsForList().rightPush(key, chatMessage);

        redisTemplate.expire(key, MESSAGE_TTL);

        log.info("메시지 저장 완료 - roomId : {}, userId : {}", roomId, userId);
    }

    // 채팅 메시지 조회(입장 시간 이후 메시지만)
    public List<ChatMessage> getMessages(Long roomId, Long userId) {

        Member member = memberRepository.findByRoomIdAndUserIdAndIsActiveTrue(roomId, userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        ErrorCode.NOT_ROOM_MEMBER.getMessage()));

        LocalDateTime joinedAt = member.getJoinedAt();

        String key =  CHAT_MESSAGE_KEY_PREFIX + roomId;
        List<Object> rawMessages = redisTemplate.opsForList().range(key, 0, -1);

        if(rawMessages == null || rawMessages.isEmpty()) {
            return Collections.emptyList();
        }

        List<ChatMessage> filteredMessages = rawMessages.stream()
                .map(obj -> (ChatMessage) obj)
                .filter(msg -> !msg.getCreatedAt().isBefore(joinedAt))
                .collect(Collectors.toList());

        return filteredMessages;
    }

    // 그룹의 모든 메시지 삭제(방 삭제 시)
    public void deleteMessages(Long roomId) {

        String key = CHAT_MESSAGE_KEY_PREFIX + roomId;
        redisTemplate.delete(key);

        log.info("메시지 삭제 완료 - roomId : {}", roomId);

    }

    // 읽지 않은 메시지 개수 조회
    public int getUnreadCount(Long roomId, Long userId) {
        Member member = memberRepository.findByRoomIdAndUserIdAndIsActiveTrue(roomId, userId)
                .orElse(null);

        if(member == null) return 0;

        LocalDateTime lastRead = member.getLastReadAt();
        if(lastRead == null) lastRead = member.getJoinedAt();

        String key = CHAT_MESSAGE_KEY_PREFIX + roomId;
        List<Object> rawMessages = redisTemplate.opsForList().range(key, 0, -1);
        if(rawMessages == null) return 0;

        LocalDateTime finalLastRead = lastRead;
        return (int) rawMessages.stream()
                .map(obj -> (ChatMessage) obj)
                .filter(msg -> msg.getCreatedAt().isAfter(finalLastRead))
                .filter(msg -> !msg.getUserId().equals(userId))
                .count();
    }

    // 읽음 처리
    public void markAsRead(Long roomId, Long userId) {
        memberRepository.findByRoomIdAndUserIdAndIsActiveTrue(roomId, userId)
                .ifPresent(member -> {
                    member.updateLastReadAt(LocalDateTime.now());
                    memberRepository.save(member);
                });
    }
}
