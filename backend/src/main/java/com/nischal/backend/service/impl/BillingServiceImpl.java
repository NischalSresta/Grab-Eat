package com.nischal.backend.service.impl;

import com.nischal.backend.dto.billing.*;
import com.nischal.backend.dto.order.OrderItemResponse;
import com.nischal.backend.entity.*;
import com.nischal.backend.exception.BadRequestException;
import com.nischal.backend.exception.ResourceNotFoundException;
import com.nischal.backend.repository.OrderRepository;
import com.nischal.backend.service.BillingService;
import com.nischal.backend.service.KhaltiPaymentService;
import com.nischal.backend.service.LoyaltyService;
import com.nischal.backend.service.OrderWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillingServiceImpl implements BillingService {

    private final OrderRepository orderRepository;
    private final OrderWebSocketService orderWebSocketService;
    private final LoyaltyService loyaltyService;
    private final KhaltiPaymentService khaltiPaymentService;

    @Override
    @Transactional(readOnly = true)
    public BillResponse getBill(Long orderId) {
        return toBillResponse(findOrderOrThrow(orderId));
    }

    @Override
    @Transactional
    public BillResponse processPayment(Long orderId, ProcessPaymentRequest request, String performedBy) {
        Order order = findOrderOrThrow(orderId);

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("Order #" + orderId + " is already paid.");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot pay for a cancelled order.");
        }

        order.setPaymentMethod(request.getPaymentMethod());
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaidAt(LocalDateTime.now());
        order.setStatus(OrderStatus.SERVED);

        Order saved = orderRepository.save(order);
        orderWebSocketService.broadcastOrderUpdate(saved);
        log.info("Order #{} paid via {} by {}", orderId, request.getPaymentMethod(), performedBy);

        // Earn loyalty points for authenticated customers
        if (saved.getUser() != null) {
            try {
                loyaltyService.earnPointsForOrder(saved);
            } catch (Exception e) {
                log.warn("Loyalty point update failed for order #{}: {}", orderId, e.getMessage());
            }
        }

        return toBillResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SplitBillResponse splitBill(Long orderId, SplitBillRequest request) {
        Order order = findOrderOrThrow(orderId);
        BigDecimal total = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal perPerson = total.divide(
                new BigDecimal(request.getNumberOfPeople()), 2, RoundingMode.HALF_UP);

        return SplitBillResponse.builder()
                .orderId(orderId)
                .totalAmount(total)
                .numberOfPeople(request.getNumberOfPeople())
                .amountPerPerson(perPerson)
                .build();
    }

    @Override
    @Transactional
    public KhaltiInitiateResponse initiateKhaltiPayment(Long orderId, String returnUrl) {
        Order order = findOrderOrThrow(orderId);
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("Order #" + orderId + " is already paid.");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot pay for a cancelled order.");
        }
        return khaltiPaymentService.initiatePayment(orderId, returnUrl);
    }

    @Override
    @Transactional
    public BillResponse verifyKhaltiPayment(KhaltiVerifyRequest request) {
        Order order = orderRepository.findByKhaltiPidx(request.getPidx())
                .orElseThrow(() -> new BadRequestException("No order found for pidx: " + request.getPidx()));

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            return toBillResponse(order); // idempotent — already verified
        }

        KhaltiLookupResponse lookup = khaltiPaymentService.lookupPayment(request.getPidx());
        if (lookup == null) {
            throw new BadRequestException("Empty lookup response from Khalti");
        }

        if (!"Completed".equals(lookup.getStatus())) {
            log.warn("Khalti payment not completed for order #{}: status={}", order.getId(), lookup.getStatus());
            throw new BadRequestException("Payment not completed. Status: " + lookup.getStatus());
        }

        order.setPaymentMethod(PaymentMethod.KHALTI);
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaidAt(LocalDateTime.now());
        order.setStatus(OrderStatus.SERVED);

        Order saved = orderRepository.save(order);
        orderWebSocketService.broadcastOrderUpdate(saved);
        log.info("Order #{} paid via Khalti (pidx={}, txn={})", order.getId(), request.getPidx(), lookup.getTransactionId());

        if (saved.getUser() != null) {
            try {
                loyaltyService.earnPointsForOrder(saved);
            } catch (Exception e) {
                log.warn("Loyalty point update failed for order #{}: {}", order.getId(), e.getMessage());
            }
        }

        return toBillResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public void requestCashPayment(Long orderId) {
        Order order = findOrderOrThrow(orderId);

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("Order #" + orderId + " is already paid.");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot request payment for a cancelled order.");
        }

        // Broadcast only — no DB write needed; staff UI updates via WebSocket
        orderWebSocketService.broadcastCashRequest(order);
        log.info("Customer requested cash payment for order #{}", orderId);
    }

    @Override
    @Transactional
    public BillResponse confirmCashPayment(Long orderId, String performedBy) {
        Order order = findOrderOrThrow(orderId);

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("Order #" + orderId + " is already paid.");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot pay for a cancelled order.");
        }

        order.setPaymentMethod(PaymentMethod.CASH);
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaidAt(LocalDateTime.now());
        order.setStatus(OrderStatus.SERVED);

        Order saved = orderRepository.save(order);
        orderWebSocketService.broadcastOrderUpdate(saved);
        log.info("Order #{} cash payment confirmed by {}", orderId, performedBy);

        if (saved.getUser() != null) {
            try {
                loyaltyService.earnPointsForOrder(saved);
            } catch (Exception e) {
                log.warn("Loyalty point update failed for order #{}: {}", orderId, e.getMessage());
            }
        }

        return toBillResponse(saved);
    }

    // Helpers

    private Order findOrderOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
    }

    private BillResponse toBillResponse(Order order) {
        BigDecimal subtotal = order.getSubtotal() != null ? order.getSubtotal() : BigDecimal.ZERO;
        BigDecimal taxAmount = subtotal.multiply(order.getTaxRate()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal serviceAmount = subtotal.multiply(order.getServiceChargeRate()).setScale(2, RoundingMode.HALF_UP);

        List<OrderItemResponse> items = order.getOrderItems().stream()
                .map(i -> OrderItemResponse.builder()
                        .id(i.getId())
                        .menuItemId(i.getMenuItem().getId())
                        .menuItemName(i.getMenuItem().getName())
                        .menuItemImageUrl(i.getMenuItem().getImageUrl())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .lineTotal(i.getLineTotal())
                        .specialInstructions(i.getSpecialInstructions())
                        .build())
                .collect(Collectors.toList());

        return BillResponse.builder()
                .orderId(order.getId())
                .tableId(order.getTable().getId())
                .tableNumber(order.getTable().getTableNumber())
                .customerName(order.getCustomerName())
                .items(items)
                .subtotal(subtotal)
                .taxRate(order.getTaxRate())
                .taxAmount(taxAmount)
                .serviceChargeRate(order.getServiceChargeRate())
                .serviceChargeAmount(serviceAmount)
                .totalAmount(order.getTotalAmount())
                .paymentStatus(order.getPaymentStatus())
                .paymentMethod(order.getPaymentMethod())
                .paidAt(order.getPaidAt())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
