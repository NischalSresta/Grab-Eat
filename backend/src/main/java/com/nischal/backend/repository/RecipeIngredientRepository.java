package com.nischal.backend.repository;

import com.nischal.backend.entity.RecipeIngredient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecipeIngredientRepository extends JpaRepository<RecipeIngredient, Long> {

    List<RecipeIngredient> findByMenuItemId(Long menuItemId);

    void deleteByMenuItemIdAndIngredientId(Long menuItemId, Long ingredientId);
}
