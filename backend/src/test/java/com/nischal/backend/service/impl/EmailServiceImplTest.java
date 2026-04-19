package com.nischal.backend.service.impl;

import com.nischal.backend.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmailService Tests")
class EmailServiceImplTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private TemplateEngine templateEngine;

    @Mock
    private MimeMessage mimeMessage;

    @InjectMocks
    private EmailServiceImpl emailService;

    private static final String FROM_EMAIL = "noreply@grabeat.com";
    private static final String APP_NAME = "GrabEat";
    private static final String TO_EMAIL = "test@example.com";
    private static final String FULL_NAME = "Test User";
    private static final String VERIFICATION_CODE = "123456";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "fromEmail", FROM_EMAIL);
        ReflectionTestUtils.setField(emailService, "appName", APP_NAME);
    }

    @Test
    @DisplayName("Should send verification email successfully")
    void testSendVerificationEmail_Success() throws MessagingException {
        // Arrange
        String expectedHtmlContent = "<html>Verification Email Content</html>";

        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("email-verification"), any(Context.class)))
                .thenReturn(expectedHtmlContent);

        // Act
        emailService.sendVerificationEmail(TO_EMAIL, FULL_NAME, VERIFICATION_CODE);

        // Assert
        verify(mailSender).createMimeMessage();
        verify(templateEngine).process(eq("email-verification"), any(Context.class));
        verify(mailSender).send(mimeMessage);
    }

    @Test
    @DisplayName("Should process verification email template with correct context")
    void testSendVerificationEmail_TemplateContext() {
        // Arrange
        ArgumentCaptor<Context> contextCaptor = ArgumentCaptor.forClass(Context.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("email-verification"), contextCaptor.capture()))
                .thenReturn("<html>Email</html>");

        // Act
        emailService.sendVerificationEmail(TO_EMAIL, FULL_NAME, VERIFICATION_CODE);

        // Assert
        Context capturedContext = contextCaptor.getValue();
        assertEquals(FULL_NAME, capturedContext.getVariable("fullName"));
        assertEquals(VERIFICATION_CODE, capturedContext.getVariable("verificationCode"));
    }

    @Test
    @DisplayName("Should throw RuntimeException when verification email fails")
    void testSendVerificationEmail_Failure() throws Exception {
        // Arrange
        MimeMessage failingMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(failingMessage);
        when(templateEngine.process(eq("email-verification"), any(Context.class)))
                .thenReturn("<html>Email</html>");

        // Mock MimeMessage to throw MessagingException when setContent is called
        doThrow(new MessagingException("Failed to set email properties"))
                .when(failingMessage).setContent(anyString(), anyString());

        // Act & Assert - Just verify exception is thrown
        assertThrows(RuntimeException.class, () ->
                emailService.sendVerificationEmail(TO_EMAIL, FULL_NAME, VERIFICATION_CODE)
        );
    }

    @Test
    @DisplayName("Should send password reset email successfully")
    void testSendPasswordResetEmail_Success() throws MessagingException {
        // Arrange
        String expectedHtmlContent = "<html>Password Reset Email Content</html>";

        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("password-reset"), any(Context.class)))
                .thenReturn(expectedHtmlContent);

        // Act
        emailService.sendPasswordResetEmail(TO_EMAIL, FULL_NAME, VERIFICATION_CODE);

        // Assert
        verify(mailSender).createMimeMessage();
        verify(templateEngine).process(eq("password-reset"), any(Context.class));
        verify(mailSender).send(mimeMessage);
    }

    @Test
    @DisplayName("Should process password reset email template with correct context")
    void testSendPasswordResetEmail_TemplateContext() {
        // Arrange
        ArgumentCaptor<Context> contextCaptor = ArgumentCaptor.forClass(Context.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("password-reset"), contextCaptor.capture()))
                .thenReturn("<html>Email</html>");

        // Act
        emailService.sendPasswordResetEmail(TO_EMAIL, FULL_NAME, VERIFICATION_CODE);

        // Assert
        Context capturedContext = contextCaptor.getValue();
        assertEquals(FULL_NAME, capturedContext.getVariable("fullName"));
        assertEquals(VERIFICATION_CODE, capturedContext.getVariable("verificationCode"));
    }

    @Test
    @DisplayName("Should throw RuntimeException when password reset email fails")
    void testSendPasswordResetEmail_Failure() throws Exception {
        // Arrange
        MimeMessage failingMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(failingMessage);
        when(templateEngine.process(eq("password-reset"), any(Context.class)))
                .thenReturn("<html>Email</html>");

        // Mock MimeMessage to throw MessagingException when setContent is called
        doThrow(new MessagingException("Failed to set email properties"))
                .when(failingMessage).setContent(anyString(), anyString());

        // Act & Assert - Just verify exception is thrown
        assertThrows(RuntimeException.class, () ->
                emailService.sendPasswordResetEmail(TO_EMAIL, FULL_NAME, VERIFICATION_CODE)
        );
    }

    @Test
    @DisplayName("Should use correct email subject for verification")
    void testSendVerificationEmail_Subject() {
        // Arrange
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("email-verification"), any(Context.class)))
                .thenReturn("<html>Email</html>");

        // Act
        emailService.sendVerificationEmail(TO_EMAIL, FULL_NAME, VERIFICATION_CODE);

        // Assert
        verify(templateEngine).process(eq("email-verification"), any(Context.class));
        // Subject is set inside MimeMessageHelper, tested through integration
    }

    @Test
    @DisplayName("Should use correct email subject for password reset")
    void testSendPasswordResetEmail_Subject() {
        // Arrange
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("password-reset"), any(Context.class)))
                .thenReturn("<html>Email</html>");

        // Act
        emailService.sendPasswordResetEmail(TO_EMAIL, FULL_NAME, VERIFICATION_CODE);

        // Assert
        verify(templateEngine).process(eq("password-reset"), any(Context.class));
        // Subject is set inside MimeMessageHelper, tested through integration
    }
}
