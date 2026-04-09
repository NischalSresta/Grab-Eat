package com.nischal.backend.service;

public interface EmailService {

    void sendVerificationEmail(String toEmail, String fullName, String verificationCode);

    void sendPasswordResetEmail(String toEmail, String fullName, String verificationCode);
}
