package com.nischal.backend.repository;

import com.nischal.backend.entity.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    Optional<Ingredient> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    List<Ingredient> findByIsActiveTrue();

    @Query("SELECT i FROM Ingredient i WHERE i.isActive = true AND i.currentStock <= i.minStockLevel ORDER BY i.name")
    List<Ingredient> findLowStockIngredients();
}
