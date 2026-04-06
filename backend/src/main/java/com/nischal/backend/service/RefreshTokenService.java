package com.nischal.backend.service;

import com.nischal.backend.entity.RefreshToken;
import com.nischal.backend.entity.User;

public interface RefreshTokenService {
    RefreshToken createRefreshToken(User user);
    RefreshToken validateRefreshToken(String token);
    void revokeRefreshToken(String token);
    void revokeAllUserTokens(User user);
    void cleanupExpiredTokens();
}
