package com.nischal.backend.service.impl;

import com.nischal.backend.dto.menu.CategoryRequest;
import com.nischal.backend.dto.menu.CategoryResponse;
import com.nischal.backend.dto.menu.MenuItemRequest;
import com.nischal.backend.dto.menu.MenuItemResponse;
import com.nischal.backend.entity.Category;
import com.nischal.backend.entity.MenuItem;
import com.nischal.backend.exception.BadRequestException;
import com.nischal.backend.exception.ResourceNotFoundException;
import com.nischal.backend.repository.CategoryRepository;
import com.nischal.backend.repository.MenuItemRepository;
import com.nischal.backend.service.MenuService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MenuServiceImpl implements MenuService {

    private final CategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;

    // Categories

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findByIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(this::toCategoryResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        return toCategoryResponse(findCategoryOrThrow(id));
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new BadRequestException("Category '" + request.getName() + "' already exists");
        }
        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();
        Category saved = categoryRepository.save(category);
        log.info("Created category: {}", saved.getName());
        return toCategoryResponse(saved);
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = findCategoryOrThrow(id);
        if (!category.getName().equals(request.getName()) && categoryRepository.existsByName(request.getName())) {
            throw new BadRequestException("Category '" + request.getName() + "' already exists");
        }
        if (request.getName() != null) category.setName(request.getName());
        if (request.getDescription() != null) category.setDescription(request.getDescription());
        if (request.getImageUrl() != null) category.setImageUrl(request.getImageUrl());
        if (request.getSortOrder() != null) category.setSortOrder(request.getSortOrder());
        return toCategoryResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = findCategoryOrThrow(id);
        category.setIsActive(false);
        categoryRepository.save(category);
        log.info("Soft-deleted category: {}", category.getName());
    }

    // Menu Items

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponse> getAllMenuItems() {
        return menuItemRepository.findByIsAvailableTrueOrderByCategoryIdAscSortOrderAsc()
                .stream()
                .map(this::toMenuItemResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponse> getMenuItemsByCategory(Long categoryId) {
        findCategoryOrThrow(categoryId);
        return menuItemRepository.findByCategoryIdAndIsAvailableTrueOrderBySortOrderAsc(categoryId)
                .stream()
                .map(this::toMenuItemResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MenuItemResponse getMenuItemById(Long id) {
        return toMenuItemResponse(findMenuItemOrThrow(id));
    }

    @Override
    @Transactional
    public MenuItemResponse createMenuItem(MenuItemRequest request) {
        Category category = findCategoryOrThrow(request.getCategoryId());
        MenuItem item = MenuItem.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .category(category)
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true)
                .isVegetarian(request.getIsVegetarian() != null ? request.getIsVegetarian() : false)
                .isVegan(request.getIsVegan() != null ? request.getIsVegan() : false)
                .isSpicy(request.getIsSpicy() != null ? request.getIsSpicy() : false)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .allergens(request.getAllergens())
                .build();
        MenuItem saved = menuItemRepository.save(item);
        log.info("Created menu item: {}", saved.getName());
        return toMenuItemResponse(saved);
    }

    @Override
    @Transactional
    public MenuItemResponse updateMenuItem(Long id, MenuItemRequest request) {
        MenuItem item = findMenuItemOrThrow(id);
        if (request.getName() != null) item.setName(request.getName());
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        if (request.getPrice() != null) item.setPrice(request.getPrice());
        if (request.getImageUrl() != null) item.setImageUrl(request.getImageUrl());
        if (request.getCategoryId() != null) item.setCategory(findCategoryOrThrow(request.getCategoryId()));
        if (request.getIsAvailable() != null) item.setIsAvailable(request.getIsAvailable());
        if (request.getIsVegetarian() != null) item.setIsVegetarian(request.getIsVegetarian());
        if (request.getIsVegan() != null) item.setIsVegan(request.getIsVegan());
        if (request.getIsSpicy() != null) item.setIsSpicy(request.getIsSpicy());
        if (request.getSortOrder() != null) item.setSortOrder(request.getSortOrder());
        if (request.getAllergens() != null) item.setAllergens(request.getAllergens());
        return toMenuItemResponse(menuItemRepository.save(item));
    }

    @Override
    @Transactional
    public void deleteMenuItem(Long id) {
        MenuItem item = findMenuItemOrThrow(id);
        item.setIsAvailable(false);
        menuItemRepository.save(item);
        log.info("Soft-deleted menu item: {}", item.getName());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponse> searchMenuItems(String keyword) {
        return menuItemRepository.searchByKeyword(keyword)
                .stream()
                .map(this::toMenuItemResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponse> getFullMenuGroupedByCategory() {
        return getAllMenuItems();
    }

    // Helpers

    private Category findCategoryOrThrow(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
    }

    private MenuItem findMenuItemOrThrow(Long id) {
        return menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + id));
    }

    private CategoryResponse toCategoryResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .imageUrl(category.getImageUrl())
                .sortOrder(category.getSortOrder())
                .isActive(category.getIsActive())
                .itemCount(category.getMenuItems() != null ? category.getMenuItems().size() : 0)
                .createdAt(category.getCreatedAt())
                .build();
    }

    private MenuItemResponse toMenuItemResponse(MenuItem item) {
        return MenuItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .price(item.getPrice())
                .imageUrl(item.getImageUrl())
                .categoryId(item.getCategory().getId())
                .categoryName(item.getCategory().getName())
                .isAvailable(item.getIsAvailable())
                .isVegetarian(item.getIsVegetarian())
                .isVegan(item.getIsVegan())
                .isSpicy(item.getIsSpicy())
                .sortOrder(item.getSortOrder())
                .allergens(item.getAllergens())
                .createdAt(item.getCreatedAt())
                .build();
    }
}
