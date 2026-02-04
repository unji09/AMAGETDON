package com.amagetdon.watchlist.dto.response;

public record WatchlistCheckResponse(
        Long watchlistId
) {
    public static WatchlistCheckResponse from(Long watchlistId) {
        return new WatchlistCheckResponse(watchlistId);
    }
}
