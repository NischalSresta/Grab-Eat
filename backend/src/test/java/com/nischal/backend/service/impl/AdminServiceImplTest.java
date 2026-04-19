package com.nischal.backend.service.impl;

import com.nischal.backend.dto.auth.UserResponse;
import com.nischal.backend.dto.user.PageResponse;
import com.nischal.backend.dto.user.UpdateUserRequest;
import com.nischal.backend.entity.Role;
import com.nischal.backend.entity.User;
import com.nischal.backend.exception.BadRequestException;
import com.nischal.backend.exception.ResourceNotFoundException;
import com.nischal.backend.mapper.UserMapper;
import com.nischal.backend.repository.EmailVerificationRepository;
import com.nischal.backend.repository.UserRepository;
import com.nischal.backend.service.UserService;
import com.nischal.backend.service.util.PaginationHelper;
import com.nischal.backend.service.util.ValidationHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Comprehensive unit tests for AdminServiceImpl.
 * Tests all methods with success and failure scenarios.
 * Follows AAA (Arrange, Act, Assert) pattern.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminService Unit Tests")
class AdminServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailVerificationRepository emailVerificationRepository;

    @Mock
    private UserService userService;

    @Mock
    private UserMapper userMapper;

    @Mock
    private ValidationHelper validationHelper;

    @Mock
    private PaginationHelper paginationHelper;

    @InjectMocks
    private AdminServiceImpl adminService;

    private User staffUser;
    private User ownerUser;
    private User customerUser;
    private UserResponse staffResponse;
    private UserResponse ownerResponse;
    private Pageable pageable;

    @BeforeEach
    void setUp() {
        // Setup test data
        staffUser = User.builder()
                .id(1L)
                .fullName("Staff Member")
                .email("staff@example.com")
                .phoneNumber("+1234567890")
                .password("encodedPassword")
                .role(Role.STAFF)
                .isActive(true)
                .isEmailVerified(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        ownerUser = User.builder()
                .id(2L)
                .fullName("Owner User")
                .email("owner@example.com")
                .phoneNumber("+9876543210")
                .password("encodedPassword")
                .role(Role.OWNER)
                .isActive(true)
                .isEmailVerified(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        customerUser = User.builder()
                .id(3L)
                .fullName("Customer User")
                .email("customer@example.com")
                .phoneNumber("+5555555555")
                .password("encodedPassword")
                .role(Role.CUSTOMER)
                .isActive(true)
                .isEmailVerified(false)
                .createdAt(LocalDateTime.now())
                .build();

        staffResponse = UserResponse.builder()
                .id(1L)
                .fullName("Staff Member")
                .email("staff@example.com")
                .phoneNumber("+1234567890")
                .role(Role.STAFF)
                .isActive(true)
                .isEmailVerified(true)
                .createdAt(LocalDateTime.now())
                .build();

        ownerResponse = UserResponse.builder()
                .id(2L)
                .fullName("Owner User")
                .email("owner@example.com")
                .phoneNumber("+9876543210")
                .role(Role.OWNER)
                .isActive(true)
                .isEmailVerified(true)
                .createdAt(LocalDateTime.now())
                .build();

        pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    // ==================== GET ALL STAFF TESTS ====================

    @Nested
    @DisplayName("Get All Staff Tests")
    class GetAllStaffTests {

        @Test
        @DisplayName("Should return paginated staff members successfully")
        void getAllStaff_Success() {
            // Arrange
            List<User> staffList = Arrays.asList(staffUser, ownerUser);
            Page<User> staffPage = new PageImpl<>(staffList, pageable, staffList.size());
            
            PageResponse<UserResponse> expectedResponse = PageResponse.<UserResponse>builder()
                    .content(Arrays.asList(staffResponse, ownerResponse))
                    .pageNumber(0)
                    .pageSize(10)
                    .totalElements(2)
                    .totalPages(1)
                    .last(true)
                    .first(true)
                    .empty(false)
                    .build();

            when(userRepository.findByRoleIn(anyList(), eq(pageable))).thenReturn(staffPage);
            when(paginationHelper.buildUserPageResponse(staffPage)).thenReturn(expectedResponse);

            // Act
            PageResponse<UserResponse> result = adminService.getAllStaff(pageable);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getTotalElements()).isEqualTo(2);
            assertThat(result.getPageNumber()).isZero();
            assertThat(result.isFirst()).isTrue();
            assertThat(result.isLast()).isTrue();

            verify(userRepository, times(1)).findByRoleIn(anyList(), eq(pageable));
            verify(paginationHelper, times(1)).buildUserPageResponse(staffPage);
        }

        @Test
        @DisplayName("Should return empty page when no staff members exist")
        void getAllStaff_EmptyResult() {
            // Arrange
            Page<User> emptyPage = new PageImpl<>(List.of(), pageable, 0);
            PageResponse<UserResponse> emptyResponse = PageResponse.<UserResponse>builder()
                    .content(List.of())
                    .pageNumber(0)
                    .pageSize(10)
                    .totalElements(0)
                    .totalPages(0)
                    .last(true)
                    .first(true)
                    .empty(true)
                    .build();

            when(userRepository.findByRoleIn(anyList(), eq(pageable))).thenReturn(emptyPage);
            when(paginationHelper.buildUserPageResponse(emptyPage)).thenReturn(emptyResponse);

            // Act
            PageResponse<UserResponse> result = adminService.getAllStaff(pageable);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isZero();
            assertThat(result.isEmpty()).isTrue();

            verify(userRepository, times(1)).findByRoleIn(anyList(), eq(pageable));
        }
    }

    // ==================== GET STAFF BY ROLE TESTS ====================

    @Nested
    @DisplayName("Get Staff By Role Tests")
    class GetStaffByRoleTests {

        @Test
        @DisplayName("Should return staff members with STAFF role")
        void getStaffByRole_StaffRole_Success() {
            // Arrange
            List<User> staffList = Arrays.asList(staffUser);
            Page<User> staffPage = new PageImpl<>(staffList, pageable, staffList.size());
            
            PageResponse<UserResponse> expectedResponse = PageResponse.<UserResponse>builder()
                    .content(Arrays.asList(staffResponse))
                    .pageNumber(0)
                    .pageSize(10)
                    .totalElements(1)
                    .totalPages(1)
                    .last(true)
                    .first(true)
                    .empty(false)
                    .build();

            doNothing().when(validationHelper).validateStaffRole(Role.STAFF);
            when(userRepository.findByRole(Role.STAFF, pageable)).thenReturn(staffPage);
            when(paginationHelper.buildUserPageResponse(staffPage)).thenReturn(expectedResponse);

            // Act
            PageResponse<UserResponse> result = adminService.getStaffByRole(Role.STAFF, pageable);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1);

            verify(validationHelper, times(1)).validateStaffRole(Role.STAFF);
            verify(userRepository, times(1)).findByRole(Role.STAFF, pageable);
            verify(paginationHelper, times(1)).buildUserPageResponse(staffPage);
        }

        @Test
        @DisplayName("Should return staff members with OWNER role")
        void getStaffByRole_OwnerRole_Success() {
            // Arrange
            List<User> ownerList = Arrays.asList(ownerUser);
            Page<User> ownerPage = new PageImpl<>(ownerList, pageable, ownerList.size());
            
            PageResponse<UserResponse> expectedResponse = PageResponse.<UserResponse>builder()
                    .content(Arrays.asList(ownerResponse))
                    .pageNumber(0)
                    .pageSize(10)
                    .totalElements(1)
                    .totalPages(1)
                    .last(true)
                    .first(true)
                    .empty(false)
                    .build();

            doNothing().when(validationHelper).validateStaffRole(Role.OWNER);
            when(userRepository.findByRole(Role.OWNER, pageable)).thenReturn(ownerPage);
            when(paginationHelper.buildUserPageResponse(ownerPage)).thenReturn(expectedResponse);

            // Act
            PageResponse<UserResponse> result = adminService.getStaffByRole(Role.OWNER, pageable);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1);

            verify(validationHelper, times(1)).validateStaffRole(Role.OWNER);
            verify(userRepository, times(1)).findByRole(Role.OWNER, pageable);
        }

        @Test
        @DisplayName("Should throw BadRequestException for invalid role")
        void getStaffByRole_InvalidRole_ThrowsException() {
            // Arrange
            doThrow(new BadRequestException("Invalid role. Only STAFF and OWNER are allowed."))
                    .when(validationHelper).validateStaffRole(Role.CUSTOMER);

            // Act & Assert
            assertThatThrownBy(() -> adminService.getStaffByRole(Role.CUSTOMER, pageable))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Invalid role");

            verify(validationHelper, times(1)).validateStaffRole(Role.CUSTOMER);
            verify(userRepository, never()).findByRole(any(), any());
        }
    }

    // ==================== GET STAFF BY ID TESTS ====================

    @Nested
    @DisplayName("Get Staff By ID Tests")
    class GetStaffByIdTests {

        @Test
        @DisplayName("Should return staff member when found by id")
        void getStaffById_Success() {
            // Arrange
            when(userService.getUserById(1L)).thenReturn(staffUser);
            doNothing().when(validationHelper).validateIsStaffMember(staffUser);
            when(userMapper.toResponse(staffUser)).thenReturn(staffResponse);

            // Act
            UserResponse result = adminService.getStaffById(1L);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getEmail()).isEqualTo("staff@example.com");
            assertThat(result.getRole()).isEqualTo(Role.STAFF);

            verify(userService, times(1)).getUserById(1L);
            verify(validationHelper, times(1)).validateIsStaffMember(staffUser);
            verify(userMapper, times(1)).toResponse(staffUser);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user not found")
        void getStaffById_NotFound_ThrowsException() {
            // Arrange
            when(userService.getUserById(999L))
                    .thenThrow(new ResourceNotFoundException("User not found with id: 999"));

            // Act & Assert
            assertThatThrownBy(() -> adminService.getStaffById(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found with id: 999");

            verify(userService, times(1)).getUserById(999L);
            verify(validationHelper, never()).validateIsStaffMember(any());
        }

        @Test
        @DisplayName("Should throw BadRequestException when user is not staff")
        void getStaffById_NotStaff_ThrowsException() {
            // Arrange
            when(userService.getUserById(3L)).thenReturn(customerUser);
            doThrow(new BadRequestException("User is not a staff member"))
                    .when(validationHelper).validateIsStaffMember(customerUser);

            // Act & Assert
            assertThatThrownBy(() -> adminService.getStaffById(3L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("User is not a staff member");

            verify(userService, times(1)).getUserById(3L);
            verify(validationHelper, times(1)).validateIsStaffMember(customerUser);
            verify(userMapper, never()).toResponse(any());
        }
    }

    // ==================== UPDATE STAFF TESTS ====================

    @Nested
    @DisplayName("Update Staff Tests")
    class UpdateStaffTests {

        @Test
        @DisplayName("Should update staff member successfully with all fields")
        void updateStaff_AllFields_Success() {
            // Arrange
            UpdateUserRequest request = UpdateUserRequest.builder()
                    .fullName("Updated Staff")
                    .email("updated@example.com")
                    .phoneNumber("+1111111111")
                    .role(Role.OWNER)
                    .isActive(false)
                    .build();

            User updatedUser = User.builder()
                    .id(1L)
                    .fullName("Updated Staff")
                    .email("updated@example.com")
                    .phoneNumber("+1111111111")
                    .role(Role.OWNER)
                    .isActive(false)
                    .isEmailVerified(true)
                    .createdAt(staffUser.getCreatedAt())
                    .updatedAt(LocalDateTime.now())
                    .build();

            UserResponse updatedResponse = UserResponse.builder()
                    .id(1L)
                    .fullName("Updated Staff")
                    .email("updated@example.com")
                    .phoneNumber("+1111111111")
                    .role(Role.OWNER)
                    .isActive(false)
                    .build();

            when(userService.getUserById(1L)).thenReturn(staffUser);
            doNothing().when(validationHelper).validateIsStaffMember(staffUser);
            doNothing().when(validationHelper).validateEmailUniqueness(anyString(), anyString());
            doNothing().when(validationHelper).validatePhoneNumberUniqueness(anyString(), anyString());
            doNothing().when(validationHelper).validateStaffRole(Role.OWNER);
            when(userRepository.save(any(User.class))).thenReturn(updatedUser);
            when(userMapper.toResponse(updatedUser)).thenReturn(updatedResponse);

            // Act
            UserResponse result = adminService.updateStaff(1L, request);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getFullName()).isEqualTo("Updated Staff");
            assertThat(result.getEmail()).isEqualTo("updated@example.com");
            assertThat(result.getRole()).isEqualTo(Role.OWNER);
            assertThat(result.getIsActive()).isFalse();

            verify(userService, times(1)).getUserById(1L);
            verify(validationHelper, times(1)).validateIsStaffMember(staffUser);
            verify(validationHelper, times(1)).validateEmailUniqueness(anyString(), anyString());
            verify(validationHelper, times(1)).validatePhoneNumberUniqueness(anyString(), anyString());
            verify(validationHelper, times(1)).validateStaffRole(Role.OWNER);
            verify(userRepository, times(1)).save(any(User.class));
        }

        @Test
        @DisplayName("Should update only provided fields")
        void updateStaff_PartialUpdate_Success() {
            // Arrange
            UpdateUserRequest request = UpdateUserRequest.builder()
                    .fullName("Updated Name Only")
                    .build();

            User updatedUser = User.builder()
                    .id(1L)
                    .fullName("Updated Name Only")
                    .email(staffUser.getEmail())
                    .phoneNumber(staffUser.getPhoneNumber())
                    .role(staffUser.getRole())
                    .isActive(staffUser.getIsActive())
                    .isEmailVerified(staffUser.getIsEmailVerified())
                    .createdAt(staffUser.getCreatedAt())
                    .updatedAt(LocalDateTime.now())
                    .build();

            when(userService.getUserById(1L)).thenReturn(staffUser);
            doNothing().when(validationHelper).validateIsStaffMember(staffUser);
            when(userRepository.save(any(User.class))).thenReturn(updatedUser);
            when(userMapper.toResponse(updatedUser)).thenReturn(staffResponse);

            // Act
            UserResponse result = adminService.updateStaff(1L, request);

            // Assert
            assertThat(result).isNotNull();
            verify(userRepository, times(1)).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when email already exists")
        void updateStaff_DuplicateEmail_ThrowsException() {
            // Arrange
            UpdateUserRequest request = UpdateUserRequest.builder()
                    .email("existing@example.com")
                    .build();

            when(userService.getUserById(1L)).thenReturn(staffUser);
            doNothing().when(validationHelper).validateIsStaffMember(staffUser);
            doThrow(new BadRequestException("Email is already in use"))
                    .when(validationHelper).validateEmailUniqueness(anyString(), anyString());

            // Act & Assert
            assertThatThrownBy(() -> adminService.updateStaff(1L, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Email is already in use");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when phone number already exists")
        void updateStaff_DuplicatePhone_ThrowsException() {
            // Arrange
            UpdateUserRequest request = UpdateUserRequest.builder()
                    .phoneNumber("+9999999999")
                    .build();

            when(userService.getUserById(1L)).thenReturn(staffUser);
            doNothing().when(validationHelper).validateIsStaffMember(staffUser);
            doThrow(new BadRequestException("Phone number is already in use"))
                    .when(validationHelper).validatePhoneNumberUniqueness(anyString(), anyString());

            // Act & Assert
            assertThatThrownBy(() -> adminService.updateStaff(1L, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Phone number is already in use");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when updating non-staff user")
        void updateStaff_NotStaffMember_ThrowsException() {
            // Arrange
            UpdateUserRequest request = UpdateUserRequest.builder()
                    .fullName("New Name")
                    .build();

            when(userService.getUserById(3L)).thenReturn(customerUser);
            doThrow(new BadRequestException("User is not a staff member"))
                    .when(validationHelper).validateIsStaffMember(customerUser);

            // Act & Assert
            assertThatThrownBy(() -> adminService.updateStaff(3L, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("User is not a staff member");

            verify(userRepository, never()).save(any());
        }
    }

    // ==================== DELETE STAFF TESTS ====================

    @Nested
    @DisplayName("Delete Staff Tests")
    class DeleteStaffTests {

        @Test
        @DisplayName("Should delete staff member successfully")
        void deleteStaff_Success() {
            // Arrange
            when(userService.getUserById(1L)).thenReturn(staffUser);
            doNothing().when(validationHelper).validateIsStaffMember(staffUser);
            doNothing().when(emailVerificationRepository).deleteByUser(staffUser);
            doNothing().when(userRepository).delete(staffUser);

            // Act
            adminService.deleteStaff(1L);

            // Assert
            verify(userService, times(1)).getUserById(1L);
            verify(validationHelper, times(1)).validateIsStaffMember(staffUser);
            verify(emailVerificationRepository, times(1)).deleteByUser(staffUser);
            verify(userRepository, times(1)).delete(staffUser);
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void deleteStaff_NotFound_ThrowsException() {
            // Arrange
            when(userService.getUserById(999L))
                    .thenThrow(new ResourceNotFoundException("User not found with id: 999"));

            // Act & Assert
            assertThatThrownBy(() -> adminService.deleteStaff(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found with id: 999");

            verify(emailVerificationRepository, never()).deleteByUser(any());
            verify(userRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Should throw exception when deleting non-staff user")
        void deleteStaff_NotStaffMember_ThrowsException() {
            // Arrange
            when(userService.getUserById(3L)).thenReturn(customerUser);
            doThrow(new BadRequestException("User is not a staff member"))
                    .when(validationHelper).validateIsStaffMember(customerUser);

            // Act & Assert
            assertThatThrownBy(() -> adminService.deleteStaff(3L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("User is not a staff member");

            verify(emailVerificationRepository, never()).deleteByUser(any());
            verify(userRepository, never()).delete(any());
        }
    }
}
