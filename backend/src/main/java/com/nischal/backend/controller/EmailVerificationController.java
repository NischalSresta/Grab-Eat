package com.nischal.backend.controller;

import com.nischal.backend.dto.request.ForgotPasswordRequest;
import com.nischal.backend.dto.request.ResendVerificationRequest;
import com.nischal.backend.dto.request.ResetPasswordRequest;
import com.nischal.backend.dto.request.VerifyEmailRequest;
import com.nischal.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class EmailVerificationController {

    private final AuthService authService;

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(
            @Valid @RequestBody VerifyEmailRequest request
    ) {
        authService.verifyEmail(request.getEmail(), request.getCode());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Email verified successfully"
        ));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(
            @Valid @RequestBody ResendVerificationRequest request
    ) {
        authService.resendVerificationCode(request.getEmail());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Verification code sent to your email"
        ));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        authService.sendPasswordResetCode(request.getEmail());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Password reset code sent to your email"
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            @RequestParam String email
    ) {
        authService.resetPassword(email, request.getCode(), request.getNewPassword());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Password reset successfully"
        ));
    }
}
