package com.amagetdon.community.repository;


import com.amagetdon.community.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GroupRepository extends JpaRepository<Group, Long> {

    boolean existsByOwnerId(Long ownerId);

    Optional<Group> findByOpenviduSession(String openviduSession);

    Optional<Group> findByJoinCode(String joinCode);

}
