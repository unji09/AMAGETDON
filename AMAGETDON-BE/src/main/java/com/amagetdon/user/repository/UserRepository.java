package com.amagetdon.user.repository;

import com.amagetdon.user.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUserId(Long userId);

    Optional<User> findByEmail(@NotBlank @Email String email);

    boolean existsByEmail(@Email String email);

    boolean existsByNickname(String nickname);
}
