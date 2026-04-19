package com.nischal.backend.service;

import com.nischal.backend.dto.menu.CategoryRequest;
import com.nischal.backend.dto.menu.CategoryResponse;
import com.nischal.backend.dto.menu.MenuItemRequest;
import com.nischal.backend.dto.menu.MenuItemResponse;

import java.util.List;

public interface MenuService {

    // Categories
    List<CategoryResponse> getAllCategories();
    CategoryResponse getCategoryById(Long id);
    CategoryResponse createCategory(CategoryRequest request);
    CategoryResponse updateCategory(Long id, CategoryRequest request);
    void deleteCategory(Long id);

    // Menu Items
    List<MenuItemResponse> getAllMenuItems();
    List<MenuItemResponse> getMenuItemsByCategory(Long categoryId);
    MenuItemResponse getMenuItemById(Long id);
    MenuItemResponse createMenuItem(MenuItemRequest request);
    MenuItemResponse updateMenuItem(Long id, MenuItemRequest request);
    void deleteMenuItem(Long id);
    List<MenuItemResponse> searchMenuItems(String keyword);
    List<MenuItemResponse> getFullMenuGroupedByCategory();
}
