package com.amagetdon.watchlist.controller;

import com.amagetdon.common.security.SecurityUtil;
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
public class WatchlistController {

    private final WatchlistService watchlistService;

    @GetMapping
    public ResponseEntity<WatchlistResponse> getWatchlist(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = SecurityUtil.getCurrentUserId();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        WatchlistResponse response = watchlistService.getWatchlist(userId, pageable);

        return ResponseEntity.ok(response);
    }
}
