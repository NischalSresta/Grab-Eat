package com.nischal.backend.dto.user;

import com.nischal.backend.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @Email(message = "Invalid email format")
    private String email;

    @Size(max = 15, message = "Phone number must not exceed 15 characters")
    private String phoneNumber;

    private Role role;

    private Boolean isActive;

    private Boolean isEmailVerified;
}
