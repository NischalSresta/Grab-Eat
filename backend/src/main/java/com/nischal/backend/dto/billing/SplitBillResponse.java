package com.nischal.backend.dto.billing;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SplitBillResponse {
    private Long orderId;
    private BigDecimal totalAmount;
    private Integer numberOfPeople;
    private BigDecimal amountPerPerson;
}
