package com.nischal.backend.dto.inventory;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateIngredientRequest {

    @NotBlank(message = "Ingredient name is required")
    @Size(max = 150)
    private String name;

    @NotBlank(message = "Unit is required")
    @Size(max = 20)
    private String unit;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal currentStock;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal minStockLevel;

    @DecimalMin("0.0")
    private BigDecimal costPerUnit;

    @Size(max = 300)
    private String description;
}
