package com.nischal.backend.repository;

import com.nischal.backend.entity.Role;
import com.nischal.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    Page<User> findByRole(Role role, Pageable pageable);

    Page<User> findByRoleIn(List<Role> roles, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.birthDate IS NOT NULL " +
           "AND FUNCTION('MONTH', u.birthDate) = :month " +
           "AND FUNCTION('DAY', u.birthDate) = :day " +
           "AND u.isActive = true")
    List<User> findByBirthDateMonthAndDay(@Param("month") int month, @Param("day") int day);
}
