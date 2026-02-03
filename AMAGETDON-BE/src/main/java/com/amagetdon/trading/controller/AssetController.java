package com.amagetdon.trading.controller;

import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.trading.controller.swagger.AssetControllerSwagger;
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
public class AssetController implements AssetControllerSwagger {
    private final AssetService assetService;

    @Override
    @GetMapping("/assets")
    public ResponseEntity<AssetResponse> getAsset() {
        Long userId = SecurityUtil.getCurrentUserId();
        AssetResponse response = assetService.getAsset(userId);
        return ResponseEntity.ok(response);
    }
}
