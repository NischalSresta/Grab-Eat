package com.nischal.backend.service.impl;

import com.nischal.backend.entity.EmailVerification;
import com.nischal.backend.entity.Role;
import com.nischal.backend.entity.User;
import com.nischal.backend.exception.InvalidVerificationCodeException;
import com.nischal.backend.repository.EmailVerificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmailVerificationService Tests")
class EmailVerificationServiceImplTest {

    @Mock
    private EmailVerificationRepository emailVerificationRepository;

    @InjectMocks
    private EmailVerificationServiceImpl emailVerificationService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .fullName("Test User")
                .email("test@example.com")
                .password("encodedPassword")
                .role(Role.CUSTOMER)
                .build();
    }

    @Test
    @DisplayName("Should create verification code successfully")
    void testCreateVerificationCode_Success() {
        // Arrange
        EmailVerification savedVerification = EmailVerification.builder()
                .id(1L)
                .user(testUser)
                .verificationCode("123456")
                .verificationType(EmailVerification.VerificationType.EMAIL_VERIFICATION)
                .expiryDate(LocalDateTime.now().plusMinutes(15))
                .isUsed(false)
                .attemptCount(0)
                .build();

        when(emailVerificationRepository.save(any(EmailVerification.class)))
                .thenReturn(savedVerification);

        // Act
        EmailVerification result = emailVerificationService.createVerificationCode(
                testUser,
                EmailVerification.VerificationType.EMAIL_VERIFICATION
        );

        // Assert
        assertNotNull(result);
        assertEquals(testUser, result.getUser());
        assertEquals(6, result.getVerificationCode().length());
        assertEquals(EmailVerification.VerificationType.EMAIL_VERIFICATION, result.getVerificationType());
        assertFalse(result.getIsUsed());
        assertEquals(0, result.getAttemptCount());

        verify(emailVerificationRepository).invalidateAllUserVerifications(
                testUser,
                EmailVerification.VerificationType.EMAIL_VERIFICATION
        );
        verify(emailVerificationRepository).save(any(EmailVerification.class));
    }

    @Test
    @DisplayName("Should create password reset code successfully")
    void testCreateVerificationCode_PasswordReset() {
        // Arrange
        EmailVerification savedVerification = EmailVerification.builder()
                .id(1L)
                .user(testUser)
                .verificationCode("654321")
                .verificationType(EmailVerification.VerificationType.PASSWORD_RESET)
                .expiryDate(LocalDateTime.now().plusMinutes(15))
                .isUsed(false)
                .attemptCount(0)
                .build();

        when(emailVerificationRepository.save(any(EmailVerification.class)))
                .thenReturn(savedVerification);

        // Act
        EmailVerification result = emailVerificationService.createVerificationCode(
                testUser,
                EmailVerification.VerificationType.PASSWORD_RESET
        );

        // Assert
        assertNotNull(result);
        assertEquals(EmailVerification.VerificationType.PASSWORD_RESET, result.getVerificationType());
        verify(emailVerificationRepository).invalidateAllUserVerifications(
                testUser,
                EmailVerification.VerificationType.PASSWORD_RESET
        );
    }

    @Test
    @DisplayName("Should verify code successfully")
    void testVerifyCode_Success() {
        // Arrange
        String code = "123456";
        EmailVerification verification = EmailVerification.builder()
                .id(1L)
                .user(testUser)
                .verificationCode(code)
                .verificationType(EmailVerification.VerificationType.EMAIL_VERIFICATION)
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .isUsed(false)
                .attemptCount(0)
                .build();

        when(emailVerificationRepository.findByUserAndVerificationCodeAndVerificationType(
                testUser,
                code,
                EmailVerification.VerificationType.EMAIL_VERIFICATION
        )).thenReturn(Optional.of(verification));

        when(emailVerificationRepository.save(any(EmailVerification.class)))
                .thenReturn(verification);

        // Act
        boolean result = emailVerificationService.verifyCode(
                testUser,
                code,
                EmailVerification.VerificationType.EMAIL_VERIFICATION
        );

        // Assert
        assertTrue(result);
        verify(emailVerificationRepository, times(2)).save(verification);
        assertTrue(verification.getIsUsed());
        assertEquals(1, verification.getAttemptCount());
    }

    @Test
    @DisplayName("Should throw exception when code not found")
    void testVerifyCode_CodeNotFound() {
        // Arrange
        String code = "999999";

        when(emailVerificationRepository.findByUserAndVerificationCodeAndVerificationType(
                testUser,
                code,
                EmailVerification.VerificationType.EMAIL_VERIFICATION
        )).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(InvalidVerificationCodeException.class, () ->
                emailVerificationService.verifyCode(
                        testUser,
                        code,
                        EmailVerification.VerificationType.EMAIL_VERIFICATION
                )
        );

        verify(emailVerificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when code is expired")
    void testVerifyCode_Expired() {
        // Arrange
        String code = "123456";
        EmailVerification verification = EmailVerification.builder()
                .id(1L)
                .user(testUser)
                .verificationCode(code)
                .verificationType(EmailVerification.VerificationType.EMAIL_VERIFICATION)
                .expiryDate(LocalDateTime.now().minusMinutes(5)) // Expired
                .isUsed(false)
                .attemptCount(0)
                .build();

        when(emailVerificationRepository.findByUserAndVerificationCodeAndVerificationType(
                testUser,
                code,
                EmailVerification.VerificationType.EMAIL_VERIFICATION
        )).thenReturn(Optional.of(verification));

        when(emailVerificationRepository.save(any(EmailVerification.class)))
                .thenReturn(verification);

        // Act & Assert
        InvalidVerificationCodeException exception = assertThrows(
                InvalidVerificationCodeException.class,
                () -> emailVerificationService.verifyCode(
                        testUser,
                        code,
                        EmailVerification.VerificationType.EMAIL_VERIFICATION
                )
        );

        assertEquals("Verification code has expired", exception.getMessage());
        assertEquals(1, verification.getAttemptCount());
    }

    @Test
    @DisplayName("Should throw exception when code already used")
    void testVerifyCode_AlreadyUsed() {
        // Arrange
        String code = "123456";
        EmailVerification verification = EmailVerification.builder()
                .id(1L)
                .user(testUser)
                .verificationCode(code)
                .verificationType(EmailVerification.VerificationType.EMAIL_VERIFICATION)
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .isUsed(true) // Already used
                .attemptCount(0)
                .build();

        when(emailVerificationRepository.findByUserAndVerificationCodeAndVerificationType(
                testUser,
                code,
                EmailVerification.VerificationType.EMAIL_VERIFICATION
        )).thenReturn(Optional.of(verification));

        when(emailVerificationRepository.save(any(EmailVerification.class)))
                .thenReturn(verification);

        // Act & Assert
        InvalidVerificationCodeException exception = assertThrows(
                InvalidVerificationCodeException.class,
                () -> emailVerificationService.verifyCode(
                        testUser,
                        code,
                        EmailVerification.VerificationType.EMAIL_VERIFICATION
                )
        );

        assertEquals("Verification code has already been used", exception.getMessage());
    }

    @Test
    @DisplayName("Should throw exception when max attempts exceeded")
    void testVerifyCode_MaxAttemptsExceeded() {
        // Arrange
        String code = "123456";
        EmailVerification verification = EmailVerification.builder()
                .id(1L)
                .user(testUser)
                .verificationCode(code)
                .verificationType(EmailVerification.VerificationType.EMAIL_VERIFICATION)
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .isUsed(false)
                .attemptCount(2) // Already 2 attempts, this will be 3rd
                .build();

        when(emailVerificationRepository.findByUserAndVerificationCodeAndVerificationType(
                testUser,
                code,
                EmailVerification.VerificationType.EMAIL_VERIFICATION
        )).thenReturn(Optional.of(verification));

        when(emailVerificationRepository.save(any(EmailVerification.class)))
                .thenReturn(verification);

        // Act & Assert
        InvalidVerificationCodeException exception = assertThrows(
                InvalidVerificationCodeException.class,
                () -> emailVerificationService.verifyCode(
                        testUser,
                        code,
                        EmailVerification.VerificationType.EMAIL_VERIFICATION
                )
        );

        assertEquals("Maximum verification attempts exceeded", exception.getMessage());
        assertEquals(3, verification.getAttemptCount());
    }

    @Test
    @DisplayName("Should invalidate all user verifications")
    void testInvalidateAllUserVerifications() {
        // Act
        emailVerificationService.invalidateAllUserVerifications(
                testUser,
                EmailVerification.VerificationType.EMAIL_VERIFICATION
        );

        // Assert
        verify(emailVerificationRepository).invalidateAllUserVerifications(
                testUser,
                EmailVerification.VerificationType.EMAIL_VERIFICATION
        );
    }

    @Test
    @DisplayName("Should cleanup expired verifications")
    void testCleanupExpiredVerifications() {
        // Act
        emailVerificationService.cleanupExpiredVerifications();

        // Assert
        ArgumentCaptor<LocalDateTime> dateCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(emailVerificationRepository).deleteExpiredVerifications(dateCaptor.capture());
        
        LocalDateTime capturedDate = dateCaptor.getValue();
        assertNotNull(capturedDate);
        assertTrue(capturedDate.isBefore(LocalDateTime.now().plusSeconds(1)));
    }

    @Test
    @DisplayName("Should generate 6-digit numeric code")
    void testCodeGeneration() {
        // Arrange
        when(emailVerificationRepository.save(any(EmailVerification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        EmailVerification result = emailVerificationService.createVerificationCode(
                testUser,
                EmailVerification.VerificationType.EMAIL_VERIFICATION
        );

        // Assert
        String code = result.getVerificationCode();
        assertEquals(6, code.length());
        assertTrue(code.matches("\\d{6}"), "Code should be 6 digits");
        int codeValue = Integer.parseInt(code);
        assertTrue(codeValue >= 100000 && codeValue <= 999999, "Code should be between 100000 and 999999");
    }
}
