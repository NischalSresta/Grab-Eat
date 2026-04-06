package com.nischal.backend.controller;

import com.nischal.backend.dto.admin.DashboardStatsResponse;
import com.nischal.backend.dto.auth.UserResponse;
import com.nischal.backend.dto.user.PageResponse;
import com.nischal.backend.dto.user.UpdateUserRequest;
import com.nischal.backend.entity.Role;
import com.nischal.backend.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/staff")
    public ResponseEntity<PageResponse<UserResponse>> getAllStaff(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        Pageable pageable = createPageable(page, size, sortBy, sortDirection);
        PageResponse<UserResponse> response = adminService.getAllStaff(pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/staff/role/{role}")
    public ResponseEntity<PageResponse<UserResponse>> getStaffByRole(
            @PathVariable Role role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        Pageable pageable = createPageable(page, size, sortBy, sortDirection);
        PageResponse<UserResponse> response = adminService.getStaffByRole(role, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/staff/{id}")
    public ResponseEntity<UserResponse> getStaffById(@PathVariable Long id) {
        UserResponse response = adminService.getStaffById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/staff/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<UserResponse> updateStaff(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        UserResponse response = adminService.updateStaff(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/staff/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteStaff(@PathVariable Long id) {
        adminService.deleteStaff(id);
        return ResponseEntity.noContent().build();
    }

    private Pageable createPageable(int page, int size, String sortBy, String sortDirection) {
        Sort.Direction direction = sortDirection.equalsIgnoreCase("ASC") 
            ? Sort.Direction.ASC 
            : Sort.Direction.DESC;
        return PageRequest.of(page, size, Sort.by(direction, sortBy));
    }
}
