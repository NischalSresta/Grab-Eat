package com.nischal.backend.dto.auth;

import com.nischal.backend.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private Role role;
    private Boolean isActive;
    private Boolean isEmailVerified;
    private LocalDateTime createdAt;
}
