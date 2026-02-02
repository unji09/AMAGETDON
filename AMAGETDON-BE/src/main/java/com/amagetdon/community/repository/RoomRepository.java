package com.amagetdon.community.repository;


import com.amagetdon.community.entity.Room;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    boolean existsByOwnerId(Long ownerId);

    Optional<Room> findByOpenviduSessionId(String openviduSession);

    Optional<Room> findByJoinCode(String joinCode);

    Page<Room> findByIsPublicTrue(Pageable pageable);

    Page<Room> findByNameContainingIgnoreCaseAndIsPublicTrue(String name, Pageable pageable);

}
