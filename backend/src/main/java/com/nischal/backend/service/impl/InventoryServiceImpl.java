package com.nischal.backend.service.impl;

import com.nischal.backend.dto.inventory.*;
import com.nischal.backend.entity.*;
import com.nischal.backend.exception.BadRequestException;
import com.nischal.backend.exception.ResourceNotFoundException;
import com.nischal.backend.repository.*;
import com.nischal.backend.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final IngredientRepository ingredientRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final MenuItemRepository menuItemRepository;

    // Ingredients

    @Override
    @Transactional(readOnly = true)
    public List<IngredientResponse> getAllIngredients() {
        return ingredientRepository.findByIsActiveTrue()
                .stream().map(this::toIngredientResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<IngredientResponse> getLowStockIngredients() {
        return ingredientRepository.findLowStockIngredients()
                .stream().map(this::toIngredientResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public IngredientResponse getIngredientById(Long id) {
        return toIngredientResponse(findIngredientOrThrow(id));
    }

    @Override
    @Transactional
    public IngredientResponse createIngredient(CreateIngredientRequest request) {
        if (ingredientRepository.findByNameIgnoreCase(request.getName()).isPresent()) {
            throw new BadRequestException("Ingredient '" + request.getName() + "' already exists.");
        }
        Ingredient ingredient = Ingredient.builder()
                .name(request.getName())
                .unit(request.getUnit())
                .currentStock(request.getCurrentStock())
                .minStockLevel(request.getMinStockLevel())
                .costPerUnit(request.getCostPerUnit() != null ? request.getCostPerUnit() : BigDecimal.ZERO)
                .description(request.getDescription())
                .build();
        return toIngredientResponse(ingredientRepository.save(ingredient));
    }

    @Override
    @Transactional
    public IngredientResponse updateIngredient(Long id, CreateIngredientRequest request) {
        Ingredient ingredient = findIngredientOrThrow(id);
        ingredient.setName(request.getName());
        ingredient.setUnit(request.getUnit());
        ingredient.setMinStockLevel(request.getMinStockLevel());
        if (request.getCostPerUnit() != null) ingredient.setCostPerUnit(request.getCostPerUnit());
        if (request.getDescription() != null) ingredient.setDescription(request.getDescription());
        return toIngredientResponse(ingredientRepository.save(ingredient));
    }

    @Override
    @Transactional
    public void deleteIngredient(Long id) {
        Ingredient ingredient = findIngredientOrThrow(id);
        ingredient.setIsActive(false);
        ingredientRepository.save(ingredient);
    }

    // Stock adjustment

    @Override
    @Transactional
    public IngredientResponse adjustStock(Long ingredientId, AdjustStockRequest request, String performedBy) {
        Ingredient ingredient = findIngredientOrThrow(ingredientId);

        BigDecimal newStock = ingredient.getCurrentStock().add(request.getQuantityChange());
        if (newStock.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Adjustment would result in negative stock for '" + ingredient.getName() + "'.");
        }

        ingredient.setCurrentStock(newStock);
        ingredientRepository.save(ingredient);

        InventoryLog entry = InventoryLog.builder()
                .ingredient(ingredient)
                .type(request.getType())
                .quantityChange(request.getQuantityChange())
                .stockAfter(newStock)
                .performedBy(performedBy)
                .notes(request.getNotes())
                .build();
        inventoryLogRepository.save(entry);

        if (newStock.compareTo(ingredient.getMinStockLevel()) <= 0) {
            log.warn("LOW STOCK ALERT: '{}' is at {} {} (min: {})",
                    ingredient.getName(), newStock, ingredient.getUnit(), ingredient.getMinStockLevel());
        }

        return toIngredientResponse(ingredient);
    }

    // Recipe management

    @Override
    @Transactional(readOnly = true)
    public List<RecipeIngredientResponse> getRecipeForMenuItem(Long menuItemId) {
        return recipeIngredientRepository.findByMenuItemId(menuItemId)
                .stream().map(this::toRecipeIngredientResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RecipeIngredientResponse addRecipeIngredient(Long menuItemId, RecipeIngredientRequest request) {
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found: " + menuItemId));
        Ingredient ingredient = findIngredientOrThrow(request.getIngredientId());

        RecipeIngredient ri = RecipeIngredient.builder()
                .menuItem(menuItem)
                .ingredient(ingredient)
                .quantityUsed(request.getQuantityUsed())
                .build();
        return toRecipeIngredientResponse(recipeIngredientRepository.save(ri));
    }

    @Override
    @Transactional
    public void removeRecipeIngredient(Long menuItemId, Long ingredientId) {
        recipeIngredientRepository.deleteByMenuItemIdAndIngredientId(menuItemId, ingredientId);
    }

    // Auto-deduction on order confirmation

    @Override
    @Transactional
    public void deductForOrder(Order order) {
        for (OrderItem orderItem : order.getOrderItems()) {
            List<RecipeIngredient> recipe =
                    recipeIngredientRepository.findByMenuItemId(orderItem.getMenuItem().getId());

            for (RecipeIngredient ri : recipe) {
                Ingredient ingredient = ri.getIngredient();
                BigDecimal totalUsed = ri.getQuantityUsed()
                        .multiply(new BigDecimal(orderItem.getQuantity()));

                BigDecimal newStock = ingredient.getCurrentStock().subtract(totalUsed);
                if (newStock.compareTo(BigDecimal.ZERO) < 0) newStock = BigDecimal.ZERO;

                ingredient.setCurrentStock(newStock);
                ingredientRepository.save(ingredient);

                InventoryLog invLog = InventoryLog.builder()
                        .ingredient(ingredient)
                        .type(InventoryLogType.ORDER_DEDUCTION)
                        .quantityChange(totalUsed.negate())
                        .stockAfter(newStock)
                        .order(order)
                        .performedBy("system")
                        .notes("Auto-deducted for order #" + order.getId())
                        .build();
                inventoryLogRepository.save(invLog);

                if (newStock.compareTo(ingredient.getMinStockLevel()) <= 0) {
                    log.warn("LOW STOCK: '{}' dropped to {} {} (threshold {})",
                            ingredient.getName(), newStock, ingredient.getUnit(), ingredient.getMinStockLevel());
                }
            }
        }
    }

    // Logs

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryLogResponse> getRecentLogs(Pageable pageable) {
        return inventoryLogRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toLogResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryLogResponse> getLogsForIngredient(Long ingredientId) {
        return inventoryLogRepository.findByIngredientIdOrderByCreatedAtDesc(ingredientId)
                .stream().map(this::toLogResponse).collect(Collectors.toList());
    }

    // Helpers

    private Ingredient findIngredientOrThrow(Long id) {
        return ingredientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ingredient not found: " + id));
    }

    private IngredientResponse toIngredientResponse(Ingredient i) {
        return IngredientResponse.builder()
                .id(i.getId())
                .name(i.getName())
                .unit(i.getUnit())
                .currentStock(i.getCurrentStock())
                .minStockLevel(i.getMinStockLevel())
                .costPerUnit(i.getCostPerUnit())
                .description(i.getDescription())
                .isActive(i.getIsActive())
                .isLowStock(i.getCurrentStock().compareTo(i.getMinStockLevel()) <= 0)
                .createdAt(i.getCreatedAt())
                .updatedAt(i.getUpdatedAt())
                .build();
    }

    private RecipeIngredientResponse toRecipeIngredientResponse(RecipeIngredient ri) {
        return RecipeIngredientResponse.builder()
                .id(ri.getId())
                .ingredientId(ri.getIngredient().getId())
                .ingredientName(ri.getIngredient().getName())
                .unit(ri.getIngredient().getUnit())
                .quantityUsed(ri.getQuantityUsed())
                .build();
    }

    private InventoryLogResponse toLogResponse(InventoryLog l) {
        return InventoryLogResponse.builder()
                .id(l.getId())
                .ingredientId(l.getIngredient().getId())
                .ingredientName(l.getIngredient().getName())
                .type(l.getType())
                .quantityChange(l.getQuantityChange())
                .stockAfter(l.getStockAfter())
                .orderId(l.getOrder() != null ? l.getOrder().getId() : null)
                .performedBy(l.getPerformedBy())
                .notes(l.getNotes())
                .createdAt(l.getCreatedAt())
                .build();
    }
}
