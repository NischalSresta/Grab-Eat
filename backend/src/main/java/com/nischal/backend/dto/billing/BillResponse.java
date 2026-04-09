package com.nischal.backend.dto.billing;

import com.nischal.backend.entity.PaymentMethod;
import com.nischal.backend.entity.PaymentStatus;
import com.nischal.backend.dto.order.OrderItemResponse;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BillResponse {
    private Long orderId;
    private Long tableId;
    private String tableNumber;
    private String customerName;

    private List<OrderItemResponse> items;

    private BigDecimal subtotal;
    private BigDecimal taxRate;
    private BigDecimal taxAmount;
    private BigDecimal serviceChargeRate;
    private BigDecimal serviceChargeAmount;
    private BigDecimal totalAmount;

    private PaymentStatus paymentStatus;
    private PaymentMethod paymentMethod;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}
