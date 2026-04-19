package com.nischal.backend.dto.loyalty;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoyaltyAccountResponse {
    private Long id;
    private Long userId;
    private String userEmail;
    private String userName;
    private Integer currentPoints;
    private Integer lifetimePoints;
    private String tier; // BRONZE / SILVER / GOLD
}
