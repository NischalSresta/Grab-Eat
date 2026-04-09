package com.nischal.backend.service;

import com.nischal.backend.entity.EmailVerification;
import com.nischal.backend.entity.User;

public interface EmailVerificationService {

    EmailVerification createVerificationCode(User user, EmailVerification.VerificationType verificationType);

    boolean verifyCode(User user, String code, EmailVerification.VerificationType verificationType);

    void invalidateAllUserVerifications(User user, EmailVerification.VerificationType verificationType);

    void cleanupExpiredVerifications();
}
