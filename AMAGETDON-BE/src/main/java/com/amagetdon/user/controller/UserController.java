package com.amagetdon.user.controller;

import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

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

    //TODO(수정) : check duplicate username

    //TODO(수정) : check duplicate email

    //TODO(수정) : reset password

    //TODO(수정) : update user title

    //TODO(수정) : get user title

    //TODO(수정) : get survey

    //TODO(수정) : submit survey


}
