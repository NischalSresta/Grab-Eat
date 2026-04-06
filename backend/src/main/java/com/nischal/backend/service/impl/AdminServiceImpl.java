package com.nischal.backend.service.impl;

import com.nischal.backend.dto.admin.DashboardStatsResponse;
import com.nischal.backend.dto.auth.UserResponse;
import com.nischal.backend.dto.user.PageResponse;
import com.nischal.backend.dto.user.UpdateUserRequest;
import com.nischal.backend.entity.OrderStatus;
import com.nischal.backend.entity.PaymentStatus;
import com.nischal.backend.entity.Role;
import com.nischal.backend.entity.User;
import com.nischal.backend.exception.ResourceNotFoundException;
import com.nischal.backend.mapper.UserMapper;
import com.nischal.backend.repository.EmailVerificationRepository;
import com.nischal.backend.repository.IngredientRepository;
import com.nischal.backend.repository.MenuItemRepository;
import com.nischal.backend.repository.OrderRepository;
import com.nischal.backend.repository.UserRepository;
import com.nischal.backend.service.AdminService;
import com.nischal.backend.service.UserService;
import com.nischal.backend.service.util.PaginationHelper;
import com.nischal.backend.service.util.ValidationHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    // Dependency Injection of abstractions (interfaces and helpers)
    private final UserRepository userRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final IngredientRepository ingredientRepository;
    private final UserService userService;
    private final UserMapper userMapper;
    private final ValidationHelper validationHelper;
    private final PaginationHelper paginationHelper;

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        long totalStaff = userRepository.findByRoleIn(Arrays.asList(Role.STAFF, Role.OWNER),
                Pageable.unpaged()).getTotalElements();
        long totalCustomers = userRepository.findByRole(Role.CUSTOMER, Pageable.unpaged()).getTotalElements();
        long activeOrders = orderRepository.findAllActiveOrders().size();

        LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);
        List<com.nischal.backend.entity.Order> todayOrders =
                orderRepository.findByDateRange(todayStart, todayEnd);
        long totalOrdersToday = todayOrders.size();

        BigDecimal revenueToday = todayOrders.stream()
                .filter(o -> o.getPaymentStatus() == PaymentStatus.PAID && o.getTotalAmount() != null)
                .map(com.nischal.backend.entity.Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDateTime monthStart = LocalDateTime.now().toLocalDate().withDayOfMonth(1).atStartOfDay();
        List<com.nischal.backend.entity.Order> monthOrders =
                orderRepository.findByDateRange(monthStart, todayEnd);
        BigDecimal revenueThisMonth = monthOrders.stream()
                .filter(o -> o.getPaymentStatus() == PaymentStatus.PAID && o.getTotalAmount() != null)
                .map(com.nischal.backend.entity.Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalMenuItems = menuItemRepository.count();
        long lowStockAlerts = ingredientRepository.findLowStockIngredients().size();

        return DashboardStatsResponse.builder()
                .totalStaff(totalStaff)
                .totalCustomers(totalCustomers)
                .activeOrders(activeOrders)
                .totalOrdersToday(totalOrdersToday)
                .totalMenuItems(totalMenuItems)
                .revenueToday(revenueToday)
                .revenueThisMonth(revenueThisMonth)
                .lowStockAlerts(lowStockAlerts)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getAllStaff(Pageable pageable) {
        log.debug("Fetching all staff members with pagination: {}", pageable);

        List<Role> staffRoles = Arrays.asList(Role.STAFF, Role.OWNER);
        Page<User> staffPage = userRepository.findByRoleIn(staffRoles, pageable);
        
        log.debug("Found {} staff members", staffPage.getTotalElements());

        return paginationHelper.buildUserPageResponse(staffPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getStaffByRole(Role role, Pageable pageable) {
        log.debug("Fetching staff members with role: {} and pagination: {}", role, pageable);
        validationHelper.validateStaffRole(role);
        
        Page<User> staffPage = userRepository.findByRole(role, pageable);
        
        log.debug("Found {} staff members with role {}", staffPage.getTotalElements(), role);
        
        return paginationHelper.buildUserPageResponse(staffPage);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getStaffById(Long id) {
        log.debug("Fetching staff member with id: {}", id);
        User user = userService.getUserById(id);
        
        // Validate staff role
        validationHelper.validateIsStaffMember(user);
        
        log.debug("Found staff member: {}", user.getEmail());
        
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateStaff(Long id, UpdateUserRequest request) {
        log.debug("Updating staff member with id: {}", id);

        User user = userService.getUserById(id);
        validationHelper.validateIsStaffMember(user);

        updateUserFields(user, request);

        // Save and return
        User updatedUser = userRepository.save(user);
        
        log.info("Successfully updated staff member with id: {}", id);
        
        return userMapper.toResponse(updatedUser);
    }

    @Override
    @Transactional
    public void deleteStaff(Long id) {
        log.debug("Deleting staff member with id: {}", id);
        
        // Retrieve and validate user
        User user = userService.getUserById(id);
        validationHelper.validateIsStaffMember(user);
        
        // Delete all related email verifications first to avoid foreign key constraint violation
        log.debug("Deleting email verifications for user: {}", id);
        emailVerificationRepository.deleteByUser(user);
        
        // Delete user
        userRepository.delete(user);
        
        log.info("Successfully deleted staff member with id: {}", id);
    }

    private void updateUserFields(User user, UpdateUserRequest request) {
        // Update full name
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }
        
        // Update email with uniqueness validation
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            validationHelper.validateEmailUniqueness(request.getEmail(), user.getEmail());
            user.setEmail(request.getEmail());
        }
        
        // Update phone number with uniqueness validation
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()) {
            validationHelper.validatePhoneNumberUniqueness(request.getPhoneNumber(), user.getPhoneNumber());
            user.setPhoneNumber(request.getPhoneNumber());
        }

        // Update role (only staff roles allowed)
        if (request.getRole() != null) {
            validationHelper.validateStaffRole(request.getRole());
            user.setRole(request.getRole());
        }

        // Update active status
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }
    }
}
