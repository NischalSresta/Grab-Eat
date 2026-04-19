package com.nischal.backend.dto.inventory;

import com.nischal.backend.entity.InventoryLogType;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryLogResponse {
    private Long id;
    private Long ingredientId;
    private String ingredientName;
    private InventoryLogType type;
    private BigDecimal quantityChange;
    private BigDecimal stockAfter;
    private Long orderId;
    private String performedBy;
    private String notes;
    private LocalDateTime createdAt;
}
