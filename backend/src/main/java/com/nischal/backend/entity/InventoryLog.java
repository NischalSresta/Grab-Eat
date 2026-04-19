package com.nischal.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_logs", indexes = {
    @Index(name = "idx_invlog_ingredient", columnList = "ingredient_id"),
    @Index(name = "idx_invlog_order", columnList = "order_id"),
    @Index(name = "idx_invlog_created", columnList = "created_at")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private InventoryLogType type;

    /** Positive = stock added, Negative = stock removed */
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantityChange;

    /** Stock level after this change */
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal stockAfter;

    /** Linked order (for ORDER_DEDUCTION logs) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    /** Who made the adjustment (username) */
    @Column(length = 150)
    private String performedBy;

    @Column(length = 500)
    private String notes;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
