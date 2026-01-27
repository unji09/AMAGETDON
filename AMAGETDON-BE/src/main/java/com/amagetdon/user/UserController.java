package com.amagetdon.user;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

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
