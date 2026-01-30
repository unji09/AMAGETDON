package com.amagetdon.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    public void sendTempPassword(String toEmail, String tempPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("임시 비밀번호 안내");
        message.setText("안녕하세요, 투자 학습 플랫폼 아마겟돈입니다.\n\n"+
                "요청하신 임시 비밀번호는 다음과 같습니다:\n\n" +
                tempPassword +
                "\n\n"+
                "로그인 후 비밀번호를 변경해 주세요.\n\n감사합니다.");
        mailSender.send(message);
    }
}
