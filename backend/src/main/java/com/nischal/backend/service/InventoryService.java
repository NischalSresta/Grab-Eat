package com.nischal.backend.service;

import com.nischal.backend.dto.inventory.*;
import com.nischal.backend.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface InventoryService {

    // --- Ingredients ---
    List<IngredientResponse> getAllIngredients();
    List<IngredientResponse> getLowStockIngredients();
    IngredientResponse getIngredientById(Long id);
    IngredientResponse createIngredient(CreateIngredientRequest request);
    IngredientResponse updateIngredient(Long id, CreateIngredientRequest request);
    void deleteIngredient(Long id);

    // --- Stock adjustments ---
    IngredientResponse adjustStock(Long ingredientId, AdjustStockRequest request, String performedBy);

    // --- Recipe management ---
    List<RecipeIngredientResponse> getRecipeForMenuItem(Long menuItemId);
    RecipeIngredientResponse addRecipeIngredient(Long menuItemId, RecipeIngredientRequest request);
    void removeRecipeIngredient(Long menuItemId, Long ingredientId);

    // --- Auto-deduction on order ---
    void deductForOrder(Order order);

    // --- Logs ---
    Page<InventoryLogResponse> getRecentLogs(Pageable pageable);
    List<InventoryLogResponse> getLogsForIngredient(Long ingredientId);
}
