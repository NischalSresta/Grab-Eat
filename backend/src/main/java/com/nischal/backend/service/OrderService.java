package com.nischal.backend.service;

import com.nischal.backend.dto.order.CreateOrderRequest;
import com.nischal.backend.dto.order.OrderResponse;
import com.nischal.backend.dto.order.UpdateOrderStatusRequest;
import com.nischal.backend.entity.OrderStatus;

import java.util.List;

public interface OrderService {

    OrderResponse placeOrder(CreateOrderRequest request);

    OrderResponse getOrderById(Long id);

    List<OrderResponse> getOrdersByTable(Long tableId);

    List<OrderResponse> getOrdersBySession(String sessionToken);

    List<OrderResponse> getMyOrders(String userEmail);

    List<OrderResponse> getActiveOrders();

    List<OrderResponse> getOrdersByStatus(OrderStatus status);

    OrderResponse updateOrderStatus(Long id, UpdateOrderStatusRequest request);

    void cancelOrder(Long id);
}
