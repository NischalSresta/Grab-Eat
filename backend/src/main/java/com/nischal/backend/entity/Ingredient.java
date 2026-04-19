package com.nischal.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ingredients", indexes = {
    @Index(name = "idx_ingredient_name", columnList = "name")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String name;

    /** Unit of measurement (g, ml, pcs, kg, L …) */
    @Column(nullable = false, length = 20)
    private String unit;

    /** Current stock quantity */
    @Column(nullable = false, precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal currentStock = BigDecimal.ZERO;

    /** Alert threshold – trigger low-stock warning when stock falls below this */
    @Column(nullable = false, precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal minStockLevel = BigDecimal.ZERO;

    /** Cost per unit (for wastage/analytics) */
    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal costPerUnit = BigDecimal.ZERO;

    @Column(length = 300)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
