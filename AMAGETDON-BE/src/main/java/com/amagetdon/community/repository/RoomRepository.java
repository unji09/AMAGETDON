package com.amagetdon.community.repository;


import com.amagetdon.community.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    boolean existsByOwnerId(Long ownerId);

    Optional<Room> findByOpenviduSessionId(String openviduSession);

    Optional<Room> findByJoinCode(String joinCode);

}
