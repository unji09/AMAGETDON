package com.amagetdon.trading.controller;

import com.amagetdon.trading.dto.response.AssetResponse;
import com.amagetdon.trading.service.AssetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/accounts")
public class AssetController {
    private final AssetService assetService;

    // TODO(재훈) : @AuthenticationPrincipal로 userId 받기
    @GetMapping("/assets")
    public ResponseEntity<AssetResponse> getAsset(Long userId) {
        AssetResponse response = assetService.getAsset(userId);
        return ResponseEntity.ok(response);
    }
}
