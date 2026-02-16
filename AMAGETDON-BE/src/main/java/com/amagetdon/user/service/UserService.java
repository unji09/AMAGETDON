package com.amagetdon.user.service;

import com.amagetdon.achievement.entity.Achievement;
import com.amagetdon.achievement.repository.AchievementRepository;
import com.amagetdon.common.ErrorCode;
import com.amagetdon.common.oauth.dto.response.KakaoUserResponse;
import com.amagetdon.user.dto.request.UserLoginRequest;
import com.amagetdon.user.dto.request.UserSignupRequest;
import com.amagetdon.user.dto.response.UserResponseDto;
import com.amagetdon.user.entity.InvestmentType;
import com.amagetdon.user.entity.LoginType;
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
    private final AchievementRepository achievementRepository;
    private final PasswordEncoder passwordEncoder;

    public User validateLogin(UserLoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new SecurityException("아이디 또는 비밀번호가 일치하지 않습니다."));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new SecurityException("비밀번호가 일치하지 않습니다.");
        }

        return user;
    }

    public User signup(UserSignupRequest request) {
        existsByEmail(request.email());
        existsByNickname(request.nickname());

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .nickname(request.nickname())
                .investmentType(request.investmentType())
                .loginType(request.loginType())
                .build();

        return userRepository.save(user);
    }

    public void withdraw(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.USER_NOT_FOUND_SIMPLE.getMessage()));
        userRepository.delete(user);
    }

    public UserResponseDto getUserInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.USER_NOT_FOUND_SIMPLE.getMessage()));
        return result(user);
    }

    public UserResponseDto updateUserInfo(Long userId, User updatedInfo) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.USER_NOT_FOUND_SIMPLE.getMessage()));

        @Email
        String email = choose(user.getEmail(), updatedInfo.getEmail());
        if(email!=null &&!email.equals(user.getEmail())) existsByEmail(email);

        String password = updatedInfo.getPassword() == null ? user.getPassword() : passwordEncoder.encode(updatedInfo.getPassword());

        String nickname = updatedInfo.getNickname();
        if (!nickname.equals(user.getNickname())) existsByNickname(nickname);

        user.updateUser(email, password, nickname);

        return result(user);
    }

    public void updatePassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.USER_NOT_FOUND_SIMPLE.getMessage()));
        user.updatePassword(passwordEncoder.encode(newPassword));
    }

    public String updateCurrentTitle(Long userId, Long achievementId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.USER_NOT_FOUND_SIMPLE.getMessage()));
        Achievement achievement = achievementRepository.findById(achievementId)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.ACHIEVEMENT_NOT_FOUND.getMessage()));
        user.updateCurrentTitle(achievement.getAchievementName());
        return user.getCurrentTitle();
    }

    public User oAuthSignup(KakaoUserResponse userInfo, LoginType provider) {
        String originalNickname = userInfo.properties().nickname();
        String nickname = originalNickname;
        int num = 0;

        while (userRepository.existsByNickname(nickname)) {
            num++;
            nickname = originalNickname + num;
        }

        User user = User.builder()
                .email(null)
                .password(null)
                .nickname(nickname)
                .investmentType(null)
                .loginType(provider)
                .socialId(userInfo.providerId())
                .build();

        return userRepository.save(user);
    }

    public User findOAuthUser(KakaoUserResponse userInfo, LoginType provider) {

        return userRepository.findBySocialIdAndLoginType(userInfo.providerId(), provider)
                .orElse(null);
    }

    private String choose(String original, String updated) {
        return updated != null ? updated : original;
    }

    private void existsByEmail(@Email String email) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 사용중인 이메일입니다.");
        }
    }

    private void existsByNickname(String nickname) {
        if (userRepository.existsByNickname(nickname)) {
            throw new IllegalArgumentException("이미 사용중인 닉네임입니다.");
        }
    }

    @Transactional
    public void updateInvestmentType(Long userId, InvestmentType investmentType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.USER_NOT_FOUND_SIMPLE.getMessage()));

        user.updateInvestmentType(investmentType);
    }


    public UserResponseDto result(User user){
        UserResponseDto result = UserResponseDto.builder()
                .userId(String.valueOf(user.getUserId()))
                .email(user.getEmail())
                .nickname(user.getNickname())
                .investmentType(user.getInvestmentType() != null ? user.getInvestmentType().name() : null)
                .loginType(user.getLoginType() != null ? user.getLoginType().name() : null)
                .socialId(user.getSocialId() != null ? user.getSocialId() : null)
                .currentTitle(user.getCurrentTitle() != null ? user.getCurrentTitle() : null)
                .totalPoints(user.getTotalPoints())
                .balance(user.getBalance())
                .build();
        return result;
    }
}
