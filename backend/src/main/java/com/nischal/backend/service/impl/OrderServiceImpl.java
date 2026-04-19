package com.nischal.backend.service.impl;

import com.nischal.backend.dto.order.*;
import com.nischal.backend.entity.*;
import com.nischal.backend.exception.BadRequestException;
import com.nischal.backend.exception.ResourceNotFoundException;
import com.nischal.backend.repository.*;
import com.nischal.backend.service.InventoryService;
import com.nischal.backend.service.OrderService;
import com.nischal.backend.service.OrderWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MenuItemRepository menuItemRepository;
    private final RestaurantTableRepository tableRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;
    private final OrderWebSocketService orderWebSocketService;

    @Override
    @Transactional
    public OrderResponse placeOrder(CreateOrderRequest request) {
        // Resolve table by QR token
        RestaurantTable table = tableRepository.findByQrToken(request.getTableQrToken())
                .orElseThrow(() -> new BadRequestException("Invalid QR code. Table not found."));

        if (!table.getIsActive()) {
            throw new BadRequestException("This table is currently unavailable.");
        }

        // Generate session token if not provided
        String sessionToken = request.getSessionToken() != null
                ? request.getSessionToken()
                : UUID.randomUUID().toString();

        // Link to user account if provided (logged-in pre-orders show up in "My Orders")
        User orderUser = null;
        if (request.getUserId() != null) {
            orderUser = userRepository.findById(request.getUserId()).orElse(null);
        }

        Order order = Order.builder()
                .table(table)
                .sessionToken(sessionToken)
                .customerName(request.getCustomerName())
                .notes(request.getNotes())
                .user(orderUser)
                .build();

        // Build order items and calculate subtotal
        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> items = new java.util.ArrayList<>();

        for (OrderItemRequest itemReq : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Menu item not found with id: " + itemReq.getMenuItemId()));

            if (!menuItem.getIsAvailable()) {
                throw new BadRequestException("'" + menuItem.getName() + "' is currently unavailable.");
            }

            BigDecimal lineTotal = menuItem.getPrice()
                    .multiply(new BigDecimal(itemReq.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .menuItem(menuItem)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(menuItem.getPrice())
                    .lineTotal(lineTotal)
                    .specialInstructions(itemReq.getSpecialInstructions())
                    .build();

            items.add(orderItem);
            subtotal = subtotal.add(lineTotal);
        }

        order.setOrderItems(items);
        order.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));

        // Calculate totals
        BigDecimal taxAmount = subtotal.multiply(order.getTaxRate()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal serviceAmount = subtotal.multiply(order.getServiceChargeRate()).setScale(2, RoundingMode.HALF_UP);
        order.setTotalAmount(subtotal.add(taxAmount).add(serviceAmount).setScale(2, RoundingMode.HALF_UP));

        Order saved = orderRepository.save(order);
        orderWebSocketService.broadcastOrderUpdate(saved);
        log.info("Order #{} placed for table {}", saved.getId(), table.getTableNumber());

        // Update table status to OCCUPIED
        table.setStatus(TableStatus.OCCUPIED);
        tableRepository.save(table);

        return toOrderResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        return toOrderResponse(findOrderOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByTable(Long tableId) {
        return orderRepository.findByTableIdOrderByCreatedAtDesc(tableId)
                .stream().map(this::toOrderResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersBySession(String sessionToken) {
        return orderRepository.findBySessionTokenOrderByCreatedAtDesc(sessionToken)
                .stream().map(this::toOrderResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toOrderResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getActiveOrders() {
        return orderRepository.findAllActiveOrders()
                .stream().map(this::toOrderResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatusOrderByCreatedAtAsc(status)
                .stream().map(this::toOrderResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long id, UpdateOrderStatusRequest request) {
        Order order = findOrderOrThrow(id);
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot update a cancelled order.");
        }
        order.setStatus(request.getStatus());

        // Deduct inventory ingredients when order is confirmed by staff
        if (request.getStatus() == OrderStatus.CONFIRMED) {
            try {
                inventoryService.deductForOrder(order);
            } catch (Exception e) {
                log.warn("Inventory deduction failed for order #{}: {}", id, e.getMessage());
            }
        }

        // When all orders for a table are served/cancelled, set table back to AVAILABLE
        if (request.getStatus() == OrderStatus.SERVED || request.getStatus() == OrderStatus.CANCELLED) {
            checkAndFreeTable(order.getTable());
        }

        Order saved = orderRepository.save(order);
        orderWebSocketService.broadcastOrderUpdate(saved);
        log.info("Order #{} status updated to {}", id, request.getStatus());
        return toOrderResponse(saved);
    }

    @Override
    @Transactional
    public void cancelOrder(Long id) {
        Order order = findOrderOrThrow(id);
        if (order.getStatus() == OrderStatus.PREPARING || order.getStatus() == OrderStatus.READY) {
            throw new BadRequestException("Cannot cancel an order that is already being prepared.");
        }
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
        checkAndFreeTable(order.getTable());
        log.info("Order #{} cancelled", id);
    }

    // Helpers

    private void checkAndFreeTable(RestaurantTable table) {
        List<Order> activeOrders = orderRepository.findAllActiveOrders()
                .stream()
                .filter(o -> o.getTable().getId().equals(table.getId()))
                .collect(Collectors.toList());

        if (activeOrders.isEmpty()) {
            table.setStatus(TableStatus.AVAILABLE);
            tableRepository.save(table);
        }
    }

    private Order findOrderOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    private OrderResponse toOrderResponse(Order order) {
        BigDecimal subtotal = order.getSubtotal() != null ? order.getSubtotal() : BigDecimal.ZERO;
        BigDecimal taxAmount = subtotal.multiply(order.getTaxRate()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal serviceAmount = subtotal.multiply(order.getServiceChargeRate()).setScale(2, RoundingMode.HALF_UP);

        List<OrderItemResponse> itemResponses = order.getOrderItems().stream()
                .map(this::toOrderItemResponse)
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .tableId(order.getTable().getId())
                .tableNumber(order.getTable().getTableNumber())
                .sessionToken(order.getSessionToken())
                .customerName(order.getCustomerName())
                .status(order.getStatus())
                .paymentStatus(order.getPaymentStatus())
                .subtotal(subtotal)
                .taxAmount(taxAmount)
                .serviceChargeAmount(serviceAmount)
                .totalAmount(order.getTotalAmount())
                .notes(order.getNotes())
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private OrderItemResponse toOrderItemResponse(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .menuItemId(item.getMenuItem().getId())
                .menuItemName(item.getMenuItem().getName())
                .menuItemImageUrl(item.getMenuItem().getImageUrl())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .lineTotal(item.getLineTotal())
                .specialInstructions(item.getSpecialInstructions())
                .build();
    }
}
