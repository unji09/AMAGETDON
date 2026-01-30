package com.amagetdon.user.controller;

import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.user.dto.request.PasswordResetEmailRequest;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.service.PasswordResetService;
import com.amagetdon.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final PasswordResetService passwordResetService;

    @GetMapping("/me")
    public ResponseEntity<?> getUserInfo() {
        Long userId = SecurityUtil.getCurrentUserId();
        User user = userService.getUserInfo(userId);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateUserInfo(@RequestBody User updatedInfo) {
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

    //TODO(수정) : update user title

    //TODO(수정) : get user title
}
