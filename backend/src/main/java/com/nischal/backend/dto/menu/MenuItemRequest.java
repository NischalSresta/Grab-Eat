package com.nischal.backend.dto.menu;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MenuItemRequest {

    @NotBlank(message = "Item name is required")
    @Size(max = 150, message = "Item name must not exceed 150 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    private String imageUrl;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private Boolean isAvailable = true;
    private Boolean isVegetarian = false;
    private Boolean isVegan = false;
    private Boolean isSpicy = false;
    private Integer sortOrder = 0;

    @Size(max = 300)
    private String allergens;
}
