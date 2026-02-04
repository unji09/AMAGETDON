package com.amagetdon.watchlist.controller;

import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.watchlist.controller.swagger.WatchlistControllerSwagger;
import com.amagetdon.watchlist.dto.request.WatchlistAddRequest;
import com.amagetdon.watchlist.dto.response.WatchlistCheckResponse;
import com.amagetdon.watchlist.dto.response.WatchlistResponse;
import com.amagetdon.watchlist.service.WatchlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/watchlist")
public class WatchlistController implements WatchlistControllerSwagger {

    private final WatchlistService watchlistService;

    @Override
    @GetMapping
    public ResponseEntity<WatchlistResponse> getWatchlist(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = SecurityUtil.getCurrentUserId();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        WatchlistResponse response = watchlistService.getWatchlist(userId, pageable);

        return ResponseEntity.ok(response);
    }

    @Override
    @GetMapping("/{stockCode}")
    public ResponseEntity<WatchlistCheckResponse> checkWatchlist(
            @PathVariable String stockCode) {
        Long userId = SecurityUtil.getCurrentUserId();
        WatchlistCheckResponse response = watchlistService.checkWatchlist(userId, stockCode);
        return ResponseEntity.ok(response);
    }

    @Override
    @PostMapping
    public ResponseEntity<Void> addToWatchlist(@RequestBody WatchlistAddRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        watchlistService.addToWatchlist(userId, request.stockCode());
        return ResponseEntity.ok().build();
    }

    @Override
    @DeleteMapping("/{watchlistId}")
    public ResponseEntity<Void> removeFromWatchlist(@PathVariable Long watchlistId) {
        Long userId = SecurityUtil.getCurrentUserId();
        watchlistService.removeFromWatchlist(userId, watchlistId);
        return ResponseEntity.ok().build();
    }
}
