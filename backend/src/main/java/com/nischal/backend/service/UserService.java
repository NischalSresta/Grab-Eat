package com.nischal.backend.service;

import com.nischal.backend.dto.user.ChangePasswordRequest;
import com.nischal.backend.dto.user.UpdateUserRequest;
import com.nischal.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {

    User getUserById(Long id);

    User getUserByEmail(String email);

    List<User> getAllUsers();

    Page<User> getAllUsersPaginated(Pageable pageable);

    User createUser(User user);

    User updateUser(Long id, UpdateUserRequest request);

    User updateUserProfile(Long id, UpdateUserRequest request);

    void changePassword(Long id, ChangePasswordRequest request);

    void activateUser(Long id);

    void deactivateUser(Long id);

    void verifyEmail(Long id);

    void updatePassword(Long id, String encodedPassword);

    // Delete operation
    void deleteUser(Long id);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);
}
