package com.nischal.backend.service.impl;

import com.nischal.backend.dto.user.ChangePasswordRequest;
import com.nischal.backend.dto.user.UpdateUserRequest;
import com.nischal.backend.entity.Role;
import com.nischal.backend.entity.User;
import com.nischal.backend.exception.BadRequestException;
import com.nischal.backend.exception.ResourceNotFoundException;
import com.nischal.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Unit Tests")
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .fullName("Test User")
                .email("test@example.com")
                .password("encodedPassword123")
                .phoneNumber("9841234567")
                .role(Role.CUSTOMER)
                .isActive(true)
                .isEmailVerified(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    // ==================== GET USER BY ID TESTS ====================

    @Test
    @DisplayName("Should return user when found by id")
    void getUserById_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // Act
        User result = userService.getUserById(1L);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getEmail()).isEqualTo("test@example.com");
        verify(userRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when user not found by id")
    void getUserById_NotFound() {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> userService.getUserById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with id: 999");
        verify(userRepository, times(1)).findById(999L);
    }

    // ==================== GET USER BY EMAIL TESTS ====================

    @Test
    @DisplayName("Should return user when found by email")
    void getUserByEmail_Success() {
        // Arrange
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        // Act
        User result = userService.getUserByEmail("test@example.com");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("test@example.com");
        verify(userRepository, times(1)).findByEmail("test@example.com");
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when user not found by email")
    void getUserByEmail_NotFound() {
        // Arrange
        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> userService.getUserByEmail("notfound@example.com"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with email: notfound@example.com");
        verify(userRepository, times(1)).findByEmail("notfound@example.com");
    }

    // ==================== GET ALL USERS TESTS ====================

    @Test
    @DisplayName("Should return all users")
    void getAllUsers_Success() {
        // Arrange
        User user2 = User.builder()
                .id(2L)
                .fullName("Test User 2")
                .email("test2@example.com")
                .role(Role.STAFF)
                .build();
        List<User> users = Arrays.asList(testUser, user2);
        when(userRepository.findAll()).thenReturn(users);

        // Act
        List<User> result = userService.getAllUsers();

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result).containsExactly(testUser, user2);
        verify(userRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should return paginated users")
    void getAllUsersPaginated_Success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> userPage = new PageImpl<>(Arrays.asList(testUser));
        when(userRepository.findAll(pageable)).thenReturn(userPage);

        // Act
        Page<User> result = userService.getAllUsersPaginated(pageable);

        // Assert
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0)).isEqualTo(testUser);
        verify(userRepository, times(1)).findAll(pageable);
    }

    // ==================== CREATE USER TESTS ====================

    @Test
    @DisplayName("Should create user successfully")
    void createUser_Success() {
        // Arrange
        User newUser = User.builder()
                .fullName("New User")
                .email("new@example.com")
                .password("password123")
                .phoneNumber("9841234568")
                .role(Role.CUSTOMER)
                .build();

        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.existsByPhoneNumber("9841234568")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(newUser);

        // Act
        User result = userService.createUser(newUser);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("new@example.com");
        verify(userRepository, times(1)).existsByEmail("new@example.com");
        verify(userRepository, times(1)).existsByPhoneNumber("9841234568");
        verify(userRepository, times(1)).save(newUser);
    }

    @Test
    @DisplayName("Should throw BadRequestException when email already exists")
    void createUser_EmailAlreadyExists() {
        // Arrange
        User newUser = User.builder()
                .email("test@example.com")
                .build();
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> userService.createUser(newUser))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Email already exists");
        verify(userRepository, times(1)).existsByEmail("test@example.com");
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw BadRequestException when phone number already exists")
    void createUser_PhoneAlreadyExists() {
        // Arrange
        User newUser = User.builder()
                .email("new@example.com")
                .phoneNumber("9841234567")
                .build();
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.existsByPhoneNumber("9841234567")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> userService.createUser(newUser))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Phone number already exists");
        verify(userRepository, times(1)).existsByEmail("new@example.com");
        verify(userRepository, times(1)).existsByPhoneNumber("9841234567");
        verify(userRepository, never()).save(any());
    }

    // ==================== UPDATE USER TESTS ====================

    @Test
    @DisplayName("Should update user successfully with all fields")
    void updateUser_Success() {
        // Arrange
        UpdateUserRequest request = UpdateUserRequest.builder()
                .fullName("Updated Name")
                .email("updated@example.com")
                .phoneNumber("9841234569")
                .role(Role.STAFF)
                .isActive(false)
                .isEmailVerified(true)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.existsByEmail("updated@example.com")).thenReturn(false);
        when(userRepository.existsByPhoneNumber("9841234569")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = userService.updateUser(1L, request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(testUser.getFullName()).isEqualTo("Updated Name");
        assertThat(testUser.getEmail()).isEqualTo("updated@example.com");
        assertThat(testUser.getPhoneNumber()).isEqualTo("9841234569");
        assertThat(testUser.getRole()).isEqualTo(Role.STAFF);
        assertThat(testUser.getIsActive()).isFalse();
        assertThat(testUser.getIsEmailVerified()).isTrue();
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    @DisplayName("Should throw BadRequestException when updating to existing email")
    void updateUser_EmailAlreadyExists() {
        // Arrange
        UpdateUserRequest request = UpdateUserRequest.builder()
                .email("existing@example.com")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> userService.updateUser(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Email already exists");
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should not check email uniqueness when email is not changed")
    void updateUser_SameEmailNotChecked() {
        // Arrange
        UpdateUserRequest request = UpdateUserRequest.builder()
                .email("test@example.com") // Same as current
                .fullName("Updated Name")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        userService.updateUser(1L, request);

        // Assert
        verify(userRepository, never()).existsByEmail(anyString());
        verify(userRepository, times(1)).save(testUser);
    }

    // ==================== UPDATE USER PROFILE TESTS ====================

    @Test
    @DisplayName("Should update user profile successfully")
    void updateUserProfile_Success() {
        // Arrange
        UpdateUserRequest request = UpdateUserRequest.builder()
                .fullName("Updated Profile Name")
                .phoneNumber("9841234570")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.existsByPhoneNumber("9841234570")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = userService.updateUserProfile(1L, request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(testUser.getFullName()).isEqualTo("Updated Profile Name");
        assertThat(testUser.getPhoneNumber()).isEqualTo("9841234570");
        verify(userRepository, times(1)).save(testUser);
    }

    // ==================== CHANGE PASSWORD TESTS ====================

    @Test
    @DisplayName("Should change password successfully")
    void changePassword_Success() {
        // Arrange
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldPassword")
                .newPassword("newPassword123")
                .confirmPassword("newPassword123")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("oldPassword", "encodedPassword123")).thenReturn(true);
        when(passwordEncoder.encode("newPassword123")).thenReturn("newEncodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        userService.changePassword(1L, request);

        // Assert
        assertThat(testUser.getPassword()).isEqualTo("newEncodedPassword");
        verify(passwordEncoder, times(1)).matches("oldPassword", "encodedPassword123");
        verify(passwordEncoder, times(1)).encode("newPassword123");
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    @DisplayName("Should throw BadRequestException when current password is incorrect")
    void changePassword_IncorrectCurrentPassword() {
        // Arrange
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("wrongPassword")
                .newPassword("newPassword123")
                .confirmPassword("newPassword123")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPassword", "encodedPassword123")).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> userService.changePassword(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Current password is incorrect");
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw BadRequestException when passwords do not match")
    void changePassword_PasswordsDoNotMatch() {
        // Arrange
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldPassword")
                .newPassword("newPassword123")
                .confirmPassword("differentPassword")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("oldPassword", "encodedPassword123")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> userService.changePassword(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("New password and confirm password do not match");
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw BadRequestException when new password is same as current")
    void changePassword_SameAsCurrentPassword() {
        // Arrange
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldPassword")
                .newPassword("oldPassword")
                .confirmPassword("oldPassword")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("oldPassword", "encodedPassword123")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> userService.changePassword(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("New password must be different from current password");
        verify(userRepository, never()).save(any());
    }

    // ==================== ACTIVATE/DEACTIVATE USER TESTS ====================

    @Test
    @DisplayName("Should activate user successfully")
    void activateUser_Success() {
        // Arrange
        testUser.setIsActive(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        userService.activateUser(1L);

        // Assert
        assertThat(testUser.getIsActive()).isTrue();
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    @DisplayName("Should deactivate user successfully")
    void deactivateUser_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        userService.deactivateUser(1L);

        // Assert
        assertThat(testUser.getIsActive()).isFalse();
        verify(userRepository, times(1)).save(testUser);
    }

    // ==================== VERIFY EMAIL TESTS ====================

    @Test
    @DisplayName("Should verify email successfully")
    void verifyEmail_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        userService.verifyEmail(1L);

        // Assert
        assertThat(testUser.getIsEmailVerified()).isTrue();
        verify(userRepository, times(1)).save(testUser);
    }

    // ==================== DELETE USER TESTS ====================

    @Test
    @DisplayName("Should delete user successfully")
    void deleteUser_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        doNothing().when(userRepository).delete(testUser);

        // Act
        userService.deleteUser(1L);

        // Assert
        verify(userRepository, times(1)).delete(testUser);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when deleting non-existent user")
    void deleteUser_NotFound() {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> userService.deleteUser(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with id: 999");
        verify(userRepository, never()).delete(any());
    }

    // ==================== EXISTS CHECKS TESTS ====================

    @Test
    @DisplayName("Should return true when email exists")
    void existsByEmail_True() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        boolean result = userService.existsByEmail("test@example.com");

        assertThat(result).isTrue();
        verify(userRepository, times(1)).existsByEmail("test@example.com");
    }

    @Test
    @DisplayName("Should return false when email does not exist")
    void existsByEmail_False() {
        // Arrange
        when(userRepository.existsByEmail("notfound@example.com")).thenReturn(false);

        // Act
        boolean result = userService.existsByEmail("notfound@example.com");

        // Assert
        assertThat(result).isFalse();
        verify(userRepository, times(1)).existsByEmail("notfound@example.com");
    }

    @Test
    @DisplayName("Should return true when phone number exists")
    void existsByPhoneNumber_True() {
        // Arrange
        when(userRepository.existsByPhoneNumber("9841234567")).thenReturn(true);

        // Act
        boolean result = userService.existsByPhoneNumber("9841234567");

        // Assert
        assertThat(result).isTrue();
        verify(userRepository, times(1)).existsByPhoneNumber("9841234567");
    }

    @Test
    @DisplayName("Should return false when phone number does not exist")
    void existsByPhoneNumber_False() {
        // Arrange
        when(userRepository.existsByPhoneNumber("9999999999")).thenReturn(false);

        // Act
        boolean result = userService.existsByPhoneNumber("9999999999");

        // Assert
        assertThat(result).isFalse();
        verify(userRepository, times(1)).existsByPhoneNumber("9999999999");
    }
}
