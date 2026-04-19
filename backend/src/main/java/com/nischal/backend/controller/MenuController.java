package com.nischal.backend.controller;

import com.nischal.backend.dto.menu.CategoryRequest;
import com.nischal.backend.dto.menu.CategoryResponse;
import com.nischal.backend.dto.menu.MenuItemRequest;
import com.nischal.backend.dto.menu.MenuItemResponse;
import com.nischal.backend.exception.BadRequestException;
import com.nischal.backend.service.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @Value("${app.upload-dir:uploads/images}")
    private String uploadDir;

    // Public endpoints (accessible via QR scan - no auth needed)

    @GetMapping
    public ResponseEntity<List<MenuItemResponse>> getFullMenu() {
        return ResponseEntity.ok(menuService.getFullMenuGroupedByCategory());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> getCategories() {
        return ResponseEntity.ok(menuService.getAllCategories());
    }

    @GetMapping("/categories/{id}/items")
    public ResponseEntity<List<MenuItemResponse>> getItemsByCategory(@PathVariable Long id) {
        return ResponseEntity.ok(menuService.getMenuItemsByCategory(id));
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<MenuItemResponse> getMenuItem(@PathVariable Long id) {
        return ResponseEntity.ok(menuService.getMenuItemById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<MenuItemResponse>> searchMenu(@RequestParam String keyword) {
        return ResponseEntity.ok(menuService.searchMenuItems(keyword));
    }

    // Staff/Owner only - CRUD

    @PostMapping("/categories")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuService.createCategory(request));
    }

    @PutMapping("/categories/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(menuService.updateCategory(id, request));
    }

    @DeleteMapping("/categories/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        menuService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/items")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<MenuItemResponse> createMenuItem(@Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuService.createMenuItem(request));
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<MenuItemResponse> updateMenuItem(
            @PathVariable Long id, @Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.ok(menuService.updateMenuItem(id, request));
    }

    @DeleteMapping("/items/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long id) {
        menuService.deleteMenuItem(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Upload a menu item image. Returns { "imageUrl": "http://localhost:8081/uploads/images/uuid.ext" }
     * Accepts JPEG, PNG, WEBP up to 5 MB.
     */
    @PostMapping(value = "/items/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) throw new BadRequestException("No file provided");

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("Image must be under 5 MB");
        }

        try {
            // Resolve to an absolute path relative to the working directory
            Path dir = Paths.get(System.getProperty("user.dir"), uploadDir).toAbsolutePath();
            Files.createDirectories(dir);

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "image";
            String ext = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf('.')) : ".jpg";
            String filename = UUID.randomUUID() + ext;

            Path dest = dir.resolve(filename);
            Files.copy(file.getInputStream(), dest);

            String url = "http://localhost:8081/uploads/images/" + filename;
            log.info("Uploaded menu image to {}: {}", dest, url);
            return ResponseEntity.ok(Map.of("imageUrl", url));

        } catch (IOException e) {
            log.error("Failed to save uploaded image: {}", e.getMessage());
            throw new BadRequestException("Failed to save image: " + e.getMessage());
        }
    }
}
