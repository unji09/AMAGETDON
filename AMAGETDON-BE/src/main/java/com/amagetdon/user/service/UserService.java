package com.amagetdon.user.service;

import com.amagetdon.user.dto.request.UserLoginRequest;
import com.amagetdon.user.dto.request.UserSignupRequest;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.repository.UserRepository;
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
}
