package com.nischal.backend.repository;

import com.nischal.backend.entity.EmailVerification;
import com.nischal.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {

    Optional<EmailVerification> findByUserAndVerificationCodeAndVerificationType(
            User user,
            String verificationCode,
            EmailVerification.VerificationType verificationType
    );

    Optional<EmailVerification> findByUserAndVerificationTypeAndIsUsedFalse(
            User user,
            EmailVerification.VerificationType verificationType
    );

    @Modifying
    @Query("UPDATE EmailVerification e SET e.isUsed = true WHERE e.user = :user AND e.verificationType = :verificationType AND e.isUsed = false")
    void invalidateAllUserVerifications(User user, EmailVerification.VerificationType verificationType);

    @Modifying
    @Query("DELETE FROM EmailVerification e WHERE e.expiryDate < :now")
    void deleteExpiredVerifications(LocalDateTime now);

    @Modifying
    @Query("DELETE FROM EmailVerification e WHERE e.user = :user")
    void deleteByUser(User user);
}
