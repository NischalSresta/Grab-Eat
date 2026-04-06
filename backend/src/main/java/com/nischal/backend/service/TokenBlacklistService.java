package com.nischal.backend.service;

import java.time.LocalDateTime;

public interface TokenBlacklistService {
    void blacklistToken(String token, LocalDateTime expiryDate, String reason, Long userId);
    boolean isTokenBlacklisted(String token);
    void cleanupExpiredTokens();
}
