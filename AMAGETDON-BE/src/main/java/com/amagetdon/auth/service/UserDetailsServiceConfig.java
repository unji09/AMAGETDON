package com.amagetdon.auth.service;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetailsService;

@Configuration
public class UserDetailsServiceConfig {

    //spring security에서 UserDetailsService 빈을 요구하므로 임시로 빈 등록
    //기능 x
    //로그에 찍히는 경고를 없애기 위함
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            throw new org.springframework.security.core.userdetails.UsernameNotFoundException(username);
        };
    }
}
