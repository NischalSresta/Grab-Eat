package com.nischal.backend.service.impl;

import com.nischal.backend.entity.BlacklistedToken;
import com.nischal.backend.repository.BlacklistedTokenRepository;
import com.nischal.backend.service.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistServiceImpl implements TokenBlacklistService {

    private final BlacklistedTokenRepository blacklistedTokenRepository;

    @Override
    @Transactional
    public void blacklistToken(String token, LocalDateTime expiryDate, String reason, Long userId) {
        BlacklistedToken blacklistedToken = BlacklistedToken.builder()
                .token(token)
                .blacklistedAt(LocalDateTime.now())
                .expiryDate(expiryDate)
                .reason(reason)
                .userId(userId)
                .build();

        blacklistedTokenRepository.save(blacklistedToken);
        log.info("Token blacklisted for user {} with reason: {}", userId, reason);
    }

    @Override
    public boolean isTokenBlacklisted(String token) {
        return blacklistedTokenRepository.existsByToken(token);
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 0 2 * * ?") // Run daily at 2 AM
    public void cleanupExpiredTokens() {
        blacklistedTokenRepository.deleteExpiredTokens(LocalDateTime.now());
        log.info("Cleaned up expired blacklisted tokens");
    }
}
