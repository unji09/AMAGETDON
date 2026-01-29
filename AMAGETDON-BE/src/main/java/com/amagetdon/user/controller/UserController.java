package com.amagetdon.user.controller;

import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.repository.UserRepository;
import com.amagetdon.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    //TODO(수정) : logout

    //TODO(수정) : get user info

    //TODO(수정) : update user info

    //TODO(수정) : delete user

    //TODO(수정) : check duplicate username

    //TODO(수정) : check duplicate email

    //TODO(수정) : reset password

    //TODO(수정) : update user title

    //TODO(수정) : get user title

    //TODO(수정) : get survey

    //TODO(수정) : submit survey


}
