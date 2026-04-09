package com.nischal.backend.service.impl;

import com.nischal.backend.entity.EmailVerification;
import com.nischal.backend.entity.User;
import com.nischal.backend.exception.InvalidVerificationCodeException;
import com.nischal.backend.repository.EmailVerificationRepository;
import com.nischal.backend.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationServiceImpl implements EmailVerificationService {

    private final EmailVerificationRepository emailVerificationRepository;
    private static final int CODE_LENGTH = 6;
    private static final int EXPIRY_MINUTES = 15;
    private static final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public EmailVerification createVerificationCode(User user, EmailVerification.VerificationType verificationType) {
        // Invalidate all previous verification codes for this user and type
        invalidateAllUserVerifications(user, verificationType);

        // Generate 6-digit code
        String code = generateSixDigitCode();

        // Create new verification
        EmailVerification verification = EmailVerification.builder()
                .user(user)
                .verificationCode(code)
                .verificationType(verificationType)
                .expiryDate(LocalDateTime.now().plusMinutes(EXPIRY_MINUTES))
                .isUsed(false)
                .attemptCount(0)
                .build();

        EmailVerification savedVerification = emailVerificationRepository.save(verification);
        log.info("Created verification code for user: {} with type: {}", user.getEmail(), verificationType);

        return savedVerification;
    }

    @Override
    @Transactional
    public boolean verifyCode(User user, String code, EmailVerification.VerificationType verificationType) {
        EmailVerification verification = emailVerificationRepository
                .findByUserAndVerificationCodeAndVerificationType(user, code, verificationType)
                .orElseThrow(() -> new InvalidVerificationCodeException("Invalid verification code"));

        // Increment attempt count
        verification.incrementAttempt();
        emailVerificationRepository.save(verification);

        // Check if code is valid
        if (!verification.isValid()) {
            if (verification.isExpired()) {
                throw new InvalidVerificationCodeException("Verification code has expired");
            }
            if (verification.getIsUsed()) {
                throw new InvalidVerificationCodeException("Verification code has already been used");
            }
            if (verification.getAttemptCount() >= 3) {
                throw new InvalidVerificationCodeException("Maximum verification attempts exceeded");
            }
        }

        // Mark as used
        verification.markAsUsed();
        emailVerificationRepository.save(verification);

        log.info("Successfully verified code for user: {} with type: {}", user.getEmail(), verificationType);
        return true;
    }

    @Override
    @Transactional
    public void invalidateAllUserVerifications(User user, EmailVerification.VerificationType verificationType) {
        emailVerificationRepository.invalidateAllUserVerifications(user, verificationType);
        log.debug("Invalidated all verification codes for user: {} with type: {}", user.getEmail(), verificationType);
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 0 3 * * *") // Run daily at 3 AM
    public void cleanupExpiredVerifications() {
        LocalDateTime now = LocalDateTime.now();
        emailVerificationRepository.deleteExpiredVerifications(now);
        log.info("Cleaned up expired email verifications");
    }

    private String generateSixDigitCode() {
        int code = secureRandom.nextInt(900000) + 100000; // Range: 100000-999999
        return String.valueOf(code);
    }
}
