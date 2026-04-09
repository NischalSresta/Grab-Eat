package com.nischal.backend.dto.billing;

import com.nischal.backend.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProcessPaymentRequest {

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    /** Optional: customer's loyalty points to redeem (discount) */
    private Long loyaltyRewardId;
}
