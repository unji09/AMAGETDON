package com.amagetdon.user.controller;

import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.user.controller.swagger.UserControllerSwagger;
import com.amagetdon.user.dto.request.PasswordResetEmailRequest;
import com.amagetdon.user.dto.request.UpdateUserTitleRequest;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.service.PasswordResetService;
import com.amagetdon.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController implements UserControllerSwagger {

    private final UserService userService;
    private final PasswordResetService passwordResetService;

    @GetMapping("/me")
    public ResponseEntity<User> getUserInfo() {
        Long userId = SecurityUtil.getCurrentUserId();
        User user = userService.getUserInfo(userId);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/me")
    public ResponseEntity<User> updateUserInfo(@RequestBody User updatedInfo) {
        Long userId = SecurityUtil.getCurrentUserId();
        User user = userService.updateUserInfo(userId, updatedInfo);
        return ResponseEntity.ok(user);
    }

    @PostMapping(("/password/email"))
    public ResponseEntity<String> sendPasswordResetEmail(@RequestBody PasswordResetEmailRequest request) {
        String email = request.getEmail().trim();
        passwordResetService.sendTempPasswordEmail(email);
        return ResponseEntity.ok("비밀번호 재설정 이메일이 전송되었습니다.");
    }

    @GetMapping("/me/title")
    public ResponseEntity<String> getUserTitle() {
        Long userId = SecurityUtil.getCurrentUserId();
        String title = userService.getUserInfo(userId).getCurrentTitle();

        return ResponseEntity.ok(title);
    }

    //TODO(수정) : 타이틀 설정으로 선택된 업적 이름이 들어가도록 변경
    @PutMapping("/me/title")
    public ResponseEntity<String> updateUserTitle(@RequestBody UpdateUserTitleRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        User user = userService.getUserInfo(userId);
        user.updateCurrentTitle(request.newTitle());

        return ResponseEntity.ok(user.getCurrentTitle());
    }
}
