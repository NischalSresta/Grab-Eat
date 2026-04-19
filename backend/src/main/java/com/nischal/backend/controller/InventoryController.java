package com.nischal.backend.controller;

import com.nischal.backend.dto.inventory.*;
import com.nischal.backend.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    // Ingredients

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<List<IngredientResponse>> getAllIngredients() {
        return ResponseEntity.ok(inventoryService.getAllIngredients());
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<List<IngredientResponse>> getLowStockIngredients() {
        return ResponseEntity.ok(inventoryService.getLowStockIngredients());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<IngredientResponse> getIngredient(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getIngredientById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<IngredientResponse> createIngredient(
            @Valid @RequestBody CreateIngredientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.createIngredient(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<IngredientResponse> updateIngredient(
            @PathVariable Long id,
            @Valid @RequestBody CreateIngredientRequest request) {
        return ResponseEntity.ok(inventoryService.updateIngredient(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteIngredient(@PathVariable Long id) {
        inventoryService.deleteIngredient(id);
        return ResponseEntity.noContent().build();
    }

    // Stock adjustment

    @PostMapping("/{id}/adjust")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<IngredientResponse> adjustStock(
            @PathVariable Long id,
            @Valid @RequestBody AdjustStockRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                inventoryService.adjustStock(id, request, userDetails.getUsername()));
    }

    // Recipe management

    @GetMapping("/recipe/{menuItemId}")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<List<RecipeIngredientResponse>> getRecipe(@PathVariable Long menuItemId) {
        return ResponseEntity.ok(inventoryService.getRecipeForMenuItem(menuItemId));
    }

    @PostMapping("/recipe/{menuItemId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<RecipeIngredientResponse> addRecipeIngredient(
            @PathVariable Long menuItemId,
            @Valid @RequestBody RecipeIngredientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inventoryService.addRecipeIngredient(menuItemId, request));
    }

    @DeleteMapping("/recipe/{menuItemId}/ingredient/{ingredientId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> removeRecipeIngredient(
            @PathVariable Long menuItemId,
            @PathVariable Long ingredientId) {
        inventoryService.removeRecipeIngredient(menuItemId, ingredientId);
        return ResponseEntity.noContent().build();
    }

    // Logs

    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<Page<InventoryLogResponse>> getRecentLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(inventoryService.getRecentLogs(PageRequest.of(page, size)));
    }

    @GetMapping("/{id}/logs")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<List<InventoryLogResponse>> getIngredientLogs(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getLogsForIngredient(id));
    }
}
