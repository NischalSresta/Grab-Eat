package com.nischal.backend.repository;

import com.nischal.backend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByIsActiveTrueOrderBySortOrderAsc();
    boolean existsByName(String name);
    Optional<Category> findByName(String name);
}
