package com.nischal.backend.dto.loyalty;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RewardResponse {
    private Long id;
    private String name;
    private String description;
    private Integer pointsCost;
    private BigDecimal discountAmount;
    private Boolean isActive;
}
