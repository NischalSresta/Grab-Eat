package com.nischal.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_verifications", indexes = {
    @Index(name = "idx_verification_code", columnList = "verificationCode"),
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_expiry_date", columnList = "expiryDate")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 6)
    private String verificationCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private VerificationType verificationType;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isUsed = false;

    @Builder.Default
    @Column(nullable = false)
    private Integer attemptCount = 0;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime usedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryDate);
    }

    public boolean isValid() {
        return !isUsed && !isExpired() && attemptCount < 3;
    }

    public void incrementAttempt() {
        this.attemptCount++;
    }

    public void markAsUsed() {
        this.isUsed = true;
        this.usedAt = LocalDateTime.now();
    }

    public enum VerificationType {
        EMAIL_VERIFICATION,
        PASSWORD_RESET
    }
}
