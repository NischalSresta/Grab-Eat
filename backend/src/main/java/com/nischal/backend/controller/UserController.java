package com.nischal.backend.controller;

import com.nischal.backend.dto.auth.UserResponse;
import com.nischal.backend.dto.user.ChangePasswordRequest;
import com.nischal.backend.dto.user.UpdateUserRequest;
import com.nischal.backend.entity.User;
import com.nischal.backend.mapper.UserMapper;
import com.nischal.backend.service.UserService;
import com.nischal.backend.service.userdetails.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userService.getUserById(userDetails.getUserId());
        return ResponseEntity.ok(userMapper.toResponse(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateCurrentUserProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User updatedUser = userService.updateUserProfile(userDetails.getUserId(), request);
        return ResponseEntity.ok(userMapper.toResponse(updatedUser));
    }

    @PostMapping("/me/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        userService.changePassword(userDetails.getUserId(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @GetMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Map<String, Object>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<User> userPage = userService.getAllUsersPaginated(pageable);

        List<UserResponse> users = userPage.getContent().stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(
                Map.of(
                        "users", users,
                        "currentPage", userPage.getNumber(),
                        "totalItems", userPage.getTotalElements(),
                        "totalPages", userPage.getTotalPages()
                )
        );
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<UserResponse>> getAllUsersNoPagination() {
        List<User> users = userService.getAllUsers();
        List<UserResponse> userResponses = users.stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userResponses);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(userMapper.toResponse(user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        User updatedUser = userService.updateUser(id, request);
        return ResponseEntity.ok(userMapper.toResponse(updatedUser));
    }


    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Map<String, String>> activateUser(@PathVariable Long id) {
        userService.activateUser(id);
        return ResponseEntity.ok(Map.of("message", "User activated successfully"));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Map<String, String>> deactivateUser(@PathVariable Long id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
    }

    @PatchMapping("/{id}/verify-email")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Map<String, String>> verifyEmail(@PathVariable Long id) {
        userService.verifyEmail(id);
        return ResponseEntity.ok(Map.of("message", "Email verified successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('STAFF', 'OWNER')")
    public ResponseEntity<Map<String, Long>> getUserCount() {
        long count = userService.getAllUsers().size();
        return ResponseEntity.ok(Map.of("count", count));
    }
}
