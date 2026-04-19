package com.nischal.backend.entity;

public enum InventoryLogType {
    ORDER_DEDUCTION,   // Auto-deducted when an order is confirmed
    MANUAL_ADJUSTMENT, // Owner/staff manually adjusts stock
    WASTAGE,           // Logged as wastage/spoilage
    RESTOCK            // Stock added (purchase/delivery)
}
