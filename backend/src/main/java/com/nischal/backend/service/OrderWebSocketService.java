package com.nischal.backend.service;

import com.nischal.backend.entity.Order;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    /** Broadcast to all kitchen/staff screens whenever an order status changes */
    public void broadcastOrderUpdate(Order order) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "ORDER_UPDATE");
            payload.put("orderId", order.getId());
            payload.put("status", order.getStatus().name());
            payload.put("paymentStatus", order.getPaymentStatus().name());
            payload.put("tableNumber", order.getTable() != null ? order.getTable().getTableNumber() : "");
            payload.put("totalAmount", order.getTotalAmount() != null ? order.getTotalAmount() : 0);
            messagingTemplate.convertAndSend((  String) "/topic/orders", (Object) payload);
            log.debug("Broadcast order #{} status={}", order.getId(), order.getStatus());
        } catch (Exception e) {
            log.warn("WebSocket broadcast failed for order #{}: {}", order.getId(), e.getMessage());
        }
    }

    /** Broadcast a cash payment request so staff screens are alerted immediately */
    public void broadcastCashRequest(Order order) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "CASH_REQUEST");
            payload.put("orderId", order.getId());
            payload.put("status", order.getStatus().name());
            payload.put("paymentStatus", order.getPaymentStatus().name());
            payload.put("tableNumber", order.getTable() != null ? order.getTable().getTableNumber() : "");
            payload.put("totalAmount", order.getTotalAmount() != null ? order.getTotalAmount() : 0);
            payload.put("cashRequested", true);
            messagingTemplate.convertAndSend((String) "/topic/orders", (Object) payload);
            log.info("Broadcast cash request for order #{} at table {}", order.getId(),
                    order.getTable() != null ? order.getTable().getTableNumber() : "?");
        } catch (Exception e) {
            log.warn("WebSocket cash-request broadcast failed for order #{}: {}", order.getId(), e.getMessage());
        }
    }
}
