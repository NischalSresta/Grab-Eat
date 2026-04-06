package com.nischal.backend.service;

import com.nischal.backend.dto.admin.DashboardStatsResponse;
import com.nischal.backend.dto.auth.UserResponse;
import com.nischal.backend.dto.user.PageResponse;
import com.nischal.backend.dto.user.UpdateUserRequest;
import com.nischal.backend.entity.Role;
import org.springframework.data.domain.Pageable;

public interface AdminService {

    DashboardStatsResponse getDashboardStats();

    PageResponse<UserResponse> getAllStaff(Pageable pageable);

    PageResponse<UserResponse> getStaffByRole(Role role, Pageable pageable);

    UserResponse getStaffById(Long id);

    UserResponse updateStaff(Long id, UpdateUserRequest request);

    void deleteStaff(Long id);
}
