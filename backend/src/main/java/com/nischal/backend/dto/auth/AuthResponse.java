package com.nischal.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    @lombok.Builder.Default
    private String tokenType = "Bearer";
    private Long expiresIn;
    private UserResponse user;
}
