package com.amagetdon.user.service;

import com.amagetdon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;


@Service
@Transactional
@RequiredArgsConstructor
public class PasswordResetService {
    private final UserRepository userRepository;
    private final UserService userService;
    private final MailService mailService;
    private final PasswordEncoder passwordEncoder;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public void sendTempPasswordEmail(String email) {
        if(!userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("해당 이메일로 가입된 사용자가 없습니다.");
        }
        String rawTemp = generate();

        userService.updatePassword(email, rawTemp);

        mailService.sendTempPassword(email, rawTemp);
    }

    public static String generate() {
        StringBuilder sb = new StringBuilder(8);

        for (int i = 0; i < 8; i++) {
            sb.append(LETTERS.charAt(RANDOM.nextInt(LETTERS.length())));
        }
        return sb.toString();
    }
}
