package com.amagetdon.user.service;

import com.amagetdon.common.ErrorCode;
import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.user.dto.request.UserLoginRequest;
import com.amagetdon.user.dto.request.UserSignupRequest;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.Email;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User validateLogin(UserLoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new SecurityException("아이디 또는 비밀번호가 일치하지 않습니다."));

        if(!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new SecurityException("비밀번호가 일치하지 않습니다.");
        }

        return user;
    }

    public User signup(UserSignupRequest request) {
        if(userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("이미 사용중인 이메일입니다.");
        }
        if(userRepository.existsByNickname(request.nickname())) {
            throw new IllegalArgumentException("이미 사용중인 닉네임입니다.");
        }

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .nickname(request.nickname())
                .investmentType(request.investmentType())
                .loginType(request.loginType())
                .build();

        return userRepository.save(user);
    }

    public void withdraw() {
        Long userId = SecurityUtil.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.RESOURCE_NOT_FOUND.getMessage()));
        userRepository.delete(user);
    }

    public User getUserInfo(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.RESOURCE_NOT_FOUND.getMessage()));
    }

    public User updateUserInfo(Long userId, User updatedInfo) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.RESOURCE_NOT_FOUND.getMessage()));

        @Email
        String email = choose(user.getEmail(), updatedInfo.getEmail());
        String password = updatedInfo.getPassword() == null ? user.getPassword() : passwordEncoder.encode(updatedInfo.getPassword());
        String nickname = updatedInfo.getNickname();

        user.updateUser(email, password, nickname);

        return user;
    }

    private String choose(String original, String updated) {
        return updated != null ? updated : original;
    }
}
