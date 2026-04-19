package com.nischal.backend.dto.loyalty;

import com.nischal.backend.entity.LoyaltyTransactionType;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoyaltyTransactionResponse {
    private Long id;
    private LoyaltyTransactionType type;
    private Integer pointsChange;
    private Integer balanceAfter;
    private Long orderId;
    private String description;
    private LocalDateTime createdAt;
}
