package com.nischal.backend.repository;

import com.nischal.backend.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findByCategoryIdAndIsAvailableTrueOrderBySortOrderAsc(Long categoryId);

    List<MenuItem> findByIsAvailableTrueOrderByCategoryIdAscSortOrderAsc();

    @Query("SELECT m FROM MenuItem m WHERE m.isAvailable = true AND " +
           "(LOWER(m.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(m.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<MenuItem> searchByKeyword(@Param("keyword") String keyword);

    @Query("SELECT m FROM MenuItem m WHERE m.isAvailable = true AND m.isVegetarian = true ORDER BY m.sortOrder ASC")
    List<MenuItem> findAllVegetarian();
}
