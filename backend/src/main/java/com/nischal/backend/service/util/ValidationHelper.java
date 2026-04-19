package com.nischal.backend.service.util;

import com.nischal.backend.entity.Role;
import com.nischal.backend.entity.User;
import com.nischal.backend.exception.BadRequestException;
import com.nischal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ValidationHelper {

    private final UserRepository userRepository;

    public void validateIsStaffMember(User user) {
        if (user.getRole() != Role.STAFF && user.getRole() != Role.OWNER) {
            throw new BadRequestException("User is not a staff member");
        }
    }

    public void validateStaffRole(Role role) {
        if (role != Role.STAFF && role != Role.OWNER) {
            throw new BadRequestException("Invalid role. Only STAFF and OWNER are allowed.");
        }
    }

    public void validateEmailUniqueness(String email, String currentEmail) {
        if (!email.equals(currentEmail) && userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email is already in use");
        }
    }

    public void validatePhoneNumberUniqueness(String phoneNumber, String currentPhoneNumber) {
        if (!phoneNumber.equals(currentPhoneNumber) && userRepository.existsByPhoneNumber(phoneNumber)) {
            throw new BadRequestException("Phone number is already in use");
        }
    }
}
