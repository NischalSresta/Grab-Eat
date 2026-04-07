package com.nischal.backend.service;

import com.nischal.backend.dto.auth.AuthResponse;
import com.nischal.backend.dto.auth.LoginRequest;
import com.nischal.backend.dto.auth.RefreshTokenRequest;
import com.nischal.backend.dto.auth.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(String token);

    void verifyEmail(String email, String code);

    void resendVerificationCode(String email);

    void sendPasswordResetCode(String email);

    void resetPassword(String email, String code, String newPassword);
}
