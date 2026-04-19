package com.nischal.backend.entity;

public enum LoyaltyTransactionType {
    EARNED,    // Points earned from an order
    REDEEMED,  // Points spent on a reward
    BONUS,     // Birthday bonus or manual bonus
    EXPIRED    // Points that expired
}
