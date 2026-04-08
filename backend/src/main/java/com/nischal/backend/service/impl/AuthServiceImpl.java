package com.nischal.backend.service.impl;

import com.nischal.backend.dto.auth.AuthResponse;
import com.nischal.backend.dto.auth.LoginRequest;
import com.nischal.backend.dto.auth.RefreshTokenRequest;
import com.nischal.backend.dto.auth.RegisterRequest;
import com.nischal.backend.entity.EmailVerification;
import com.nischal.backend.entity.User;
import com.nischal.backend.exception.BadRequestException;
import com.nischal.backend.exception.UnauthorizedException;
import com.nischal.backend.mapper.UserMapper;
import com.nischal.backend.jwt.JwtUtil;
import com.nischal.backend.service.AuthService;
import com.nischal.backend.service.EmailService;
import com.nischal.backend.service.EmailVerificationService;
import com.nischal.backend.service.UserService;
import com.nischal.backend.service.userdetails.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserService userService;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final EmailVerificationService emailVerificationService;
    private final EmailService emailService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validate email uniqueness
        if (userService.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        // Validate phone number uniqueness if provided
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isEmpty()) {
            if (userService.existsByPhoneNumber(request.getPhoneNumber())) {
                throw new BadRequestException("Phone number already exists");
            }
        }

        // Create user entity
        User user = userMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Save user
        User savedUser = userService.createUser(user);

        // Wrap in CustomUserDetails for proper RBA
        CustomUserDetails userDetails = new CustomUserDetails(savedUser);

        // Generate tokens
        String accessToken = jwtUtil.generateAccessToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtUtil.getAccessTokenExpiration())
                .user(userMapper.toResponse(savedUser))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            // Get CustomUserDetails from authentication
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            User user = userDetails.getUser();

            // Generate tokens
            String accessToken = jwtUtil.generateAccessToken(userDetails);
            String refreshToken = jwtUtil.generateRefreshToken(userDetails);

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .expiresIn(jwtUtil.getAccessTokenExpiration())
                    .user(userMapper.toResponse(user))
                    .build();

        } catch (AuthenticationException e) {
            throw new UnauthorizedException("Invalid email or password");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        // Validate refresh token
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        // Extract user email from token
        String email = jwtUtil.extractUsername(refreshToken);
        User user = userService.getUserByEmail(email);

        // Wrap in CustomUserDetails for proper RBA
        CustomUserDetails userDetails = new CustomUserDetails(user);

        // Generate new tokens
        String newAccessToken = jwtUtil.generateAccessToken(userDetails);
        String newRefreshToken = jwtUtil.generateRefreshToken(userDetails);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtUtil.getAccessTokenExpiration())
                .user(userMapper.toResponse(user))
                .build();
    }

    @Override
    public void logout(String token) {
        // Client-side logout — token removed from storage on the frontend
    }

    @Override
    @Transactional
    public void verifyEmail(String email, String code) {
        User user = userService.getUserByEmail(email);
        emailVerificationService.verifyCode(user, code, EmailVerification.VerificationType.EMAIL_VERIFICATION);
        userService.verifyEmail(user.getId());
    }

    @Override
    @Transactional
    public void resendVerificationCode(String email) {
        User user = userService.getUserByEmail(email);
        if (Boolean.TRUE.equals(user.getIsEmailVerified())) {
            throw new BadRequestException("Email is already verified");
        }
        EmailVerification verification = emailVerificationService.createVerificationCode(
                user, EmailVerification.VerificationType.EMAIL_VERIFICATION);
        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), verification.getVerificationCode());
    }

    @Override
    @Transactional
    public void sendPasswordResetCode(String email) {
        User user = userService.getUserByEmail(email);
        EmailVerification verification = emailVerificationService.createVerificationCode(
                user, EmailVerification.VerificationType.PASSWORD_RESET);
        emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), verification.getVerificationCode());
    }

    @Override
    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        User user = userService.getUserByEmail(email);
        emailVerificationService.verifyCode(user, code, EmailVerification.VerificationType.PASSWORD_RESET);
        userService.updatePassword(user.getId(), passwordEncoder.encode(newPassword));
    }
}
