package com.amagetdon.community.repository;

import com.amagetdon.community.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member,Long> {

    // 1인 1그룹 체크용
    Optional<Member> findByUserIdAndIsActiveTrue(Long userId);

    // 특정 그룹의 특정 유저 활성 멤버쉽 조회
    Optional<Member> findByRoomIdAndUserIdAndIsActiveTrue(Long roomId ,Long userId);

    // 특정 그룹의 확성 멤버 수 조회
    long countByRoomIdAndIsActiveTrue(Long roomId);
}
