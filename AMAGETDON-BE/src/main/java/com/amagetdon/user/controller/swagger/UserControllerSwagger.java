package com.amagetdon.user.controller.swagger;

import com.amagetdon.user.dto.request.PasswordResetEmailRequest;
import com.amagetdon.user.dto.request.UpdateUserTitleRequest;
import com.amagetdon.user.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;

@Tag(name = "유저", description = "사용자 정보 관리 API")
public interface UserControllerSwagger {

    @Operation(
            summary = "내 정보 조회",
            description = "현재 로그인된 사용자의 정보를 조회합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(
                            schema = @Schema(implementation = User.class)
                    )
            ),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    ResponseEntity<User> getUserInfo();

    @Operation(
            summary = "내 정보 수정",
            description = "현재 로그인된 사용자의 이메일, 비밀번호, 닉네임 정보를 수정합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "수정 성공",
                    content = @Content(
                            schema = @Schema(implementation = User.class)
                    )
            ),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    ResponseEntity<User> updateUserInfo(
            @Parameter(description = "수정할 사용자 정보", required = true)
            User updatedInfo
    );

    @Operation(
            summary = "비밀번호 재설정 이메일 발송",
            description = "입력한 이메일로 임시 비밀번호를 발송합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "이메일 발송 성공",
                    content = @Content(
                            examples = @ExampleObject(value = "비밀번호 재설정 이메일이 전송되었습니다.")
                    )
            ),
            @ApiResponse(responseCode = "400", description = "존재하지 않는 이메일")
    })
    ResponseEntity<String> sendPasswordResetEmail(
            @Parameter(description = "비밀번호 재설정 요청 이메일", required = true)
            PasswordResetEmailRequest request
    );

    @Operation(
            summary = "현재 타이틀 조회",
            description = "현재 로그인된 사용자의 대표 타이틀을 조회합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(
                            examples = @ExampleObject(value = "\"초보 투자자\"")
                    )
            )
    })
    ResponseEntity<String> getUserTitle();

    @Operation(
            summary = "대표 타이틀 변경",
            description = "사용자의 대표 타이틀을 변경합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "변경 성공",
                    content = @Content(
                            examples = @ExampleObject(value = "\"성장 중인 투자자\"")
                    )
            ),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    ResponseEntity<String> updateUserTitle(
            @Parameter(description = "변경할 타이틀 정보", required = true)
            UpdateUserTitleRequest request
    );
}
