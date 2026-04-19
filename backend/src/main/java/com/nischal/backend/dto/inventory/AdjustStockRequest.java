package com.nischal.backend.dto.inventory;

import com.nischal.backend.entity.InventoryLogType;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdjustStockRequest {

    @NotNull(message = "Quantity change is required")
    private BigDecimal quantityChange; // positive = add, negative = remove

    @NotNull(message = "Log type is required")
    private InventoryLogType type; // MANUAL_ADJUSTMENT, WASTAGE, RESTOCK

    private String notes;
}
