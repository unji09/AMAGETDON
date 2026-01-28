package com.amagetdon.user;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    //create

    //login

    //logout

    //get user info

    //update user info

    //delete user

    //check duplicate username

    //check duplicate email

    //reset password

    //update user title

    //get user title

    //get survey

    //submit survey


}
