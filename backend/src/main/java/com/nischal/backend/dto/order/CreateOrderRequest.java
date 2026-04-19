package com.nischal.backend.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CreateOrderRequest {

    // QR token from the scanned table QR code
    @NotBlank(message = "Table QR token is required")
    private String tableQrToken;

    // Optional - guest name for the order
    private String customerName;

    // Session token to group multiple orders at the same table visit
    private String sessionToken;

    // Optional - set when a logged-in user places the order so it shows in "My Orders"
    private Long userId;

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;

    private String notes;
}
