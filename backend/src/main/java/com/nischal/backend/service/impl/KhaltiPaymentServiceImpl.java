package com.nischal.backend.service.impl;

import com.nischal.backend.dto.billing.KhaltiInitiateResponse;
import com.nischal.backend.dto.billing.KhaltiLookupResponse;
import com.nischal.backend.entity.Order;
import com.nischal.backend.exception.BadRequestException;
import com.nischal.backend.repository.OrderRepository;
import com.nischal.backend.service.KhaltiPaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class KhaltiPaymentServiceImpl implements KhaltiPaymentService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final OrderRepository orderRepository;
    private final String secretKey;
    private final String baseUrl;

    public KhaltiPaymentServiceImpl(
            OrderRepository orderRepository,
            @Value("${khalti.secret-key}") String secretKey,
            @Value("${khalti.base-url:https://dev.khalti.com/api/v2}") String baseUrl) {
        this.orderRepository = orderRepository;
        this.secretKey = secretKey;
        this.baseUrl = baseUrl;
    }

    @Override
    public KhaltiInitiateResponse initiatePayment(Long orderId, String returnUrl) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BadRequestException("Order not found: " + orderId));

        // If a pidx already exists for this order, reuse it to avoid Khalti's
        // "similar request already being processed" error on repeated clicks.
        if (order.getKhaltiPidx() != null && !order.getKhaltiPidx().isBlank()) {
            String existingPidx = order.getKhaltiPidx();
            String paymentUrl = (baseUrl.contains("dev.khalti.com"))
                    ? "https://test-pay.khalti.com/?pidx=" + existingPidx
                    : "https://pay.khalti.com/?pidx=" + existingPidx;
            log.info("Reusing existing Khalti pidx {} for order #{}", existingPidx, orderId);
            return KhaltiInitiateResponse.builder()
                    .pidx(existingPidx)
                    .paymentUrl(paymentUrl)
                    .build();
        }

        // Khalti requires amount in paisa (1 NPR = 100 paisa), minimum 1000 paisa (Rs. 10)
        BigDecimal totalNPR = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        long amountPaisa = totalNPR.multiply(BigDecimal.valueOf(100)).longValue();

        // Use a unique purchase_order_id per attempt so Khalti doesn't treat retries as duplicates
        String purchaseOrderId = "ORDER-" + orderId + "-" + System.currentTimeMillis();

        Map<String, Object> body = new HashMap<>();
        body.put("return_url", returnUrl);
        body.put("website_url", "http://localhost:5173");
        body.put("amount", amountPaisa);
        body.put("purchase_order_id", purchaseOrderId);
        body.put("purchase_order_name", "GrabEats Order #" + orderId + " — Table " + order.getTable().getTableNumber());

        Map<String, String> customerInfo = new HashMap<>();
        if (order.getUser() != null) {
            customerInfo.put("name", order.getUser().getFullName() != null ? order.getUser().getFullName() : "Customer");
            customerInfo.put("email", order.getUser().getEmail() != null ? order.getUser().getEmail() : "");
            customerInfo.put("phone", order.getUser().getPhoneNumber() != null ? order.getUser().getPhoneNumber() : "");
        } else {
            customerInfo.put("name", order.getCustomerName() != null ? order.getCustomerName() : "Guest");
            customerInfo.put("email", "");
            customerInfo.put("phone", "");
        }
        body.put("customer_info", customerInfo);

        HttpHeaders headers = buildHeaders();
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
                    baseUrl + "/epayment/initiate/", entity, (Class<Map<String, Object>>) (Class<?>) Map.class);

            Map<String, Object> resp = response.getBody();
            if (resp == null) throw new BadRequestException("Empty response from Khalti");

            String pidx = (String) resp.get("pidx");
            if (pidx == null) throw new BadRequestException("Khalti did not return a pidx");

            // Persist pidx so we can look up the order on callback
            order.setKhaltiPidx(pidx);
            orderRepository.save(order);

            return KhaltiInitiateResponse.builder()
                    .pidx(pidx)
                    .paymentUrl((String) resp.get("payment_url"))
                    .expiresAt((String) resp.get("expires_at"))
                    .expiresIn(resp.get("expires_in") instanceof Integer i ? i : null)
                    .build();

        } catch (HttpClientErrorException e) {
            log.error("Khalti initiate failed for order #{}: {} — {}", orderId, e.getStatusCode(), e.getResponseBodyAsString());
            throw new BadRequestException("Khalti payment error: " + e.getStatusCode() + ". Please try again.");
        } catch (HttpServerErrorException e) {
            log.error("Khalti sandbox unavailable for order #{}: {}", orderId, e.getStatusCode());
            throw new BadRequestException("Khalti sandbox is temporarily unavailable (503). Please try again in a few minutes or pay with cash.");
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Khalti initiate unexpected error for order #{}: {}", orderId, e.getMessage());
            throw new BadRequestException("Could not connect to Khalti. Please try again or pay with cash.");
        }
    }

    @Override
    public KhaltiLookupResponse lookupPayment(String pidx) {
        Map<String, String> body = new HashMap<>();
        body.put("pidx", pidx);

        HttpHeaders headers = buildHeaders();
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<KhaltiLookupResponse> response = restTemplate.postForEntity(
                    baseUrl + "/epayment/lookup/", entity, KhaltiLookupResponse.class);
            return response.getBody();
        } catch (HttpClientErrorException e) {
            log.error("Khalti lookup failed for pidx {}: {} — {}", pidx, e.getStatusCode(), e.getResponseBodyAsString());
            throw new BadRequestException("Khalti lookup error: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Khalti lookup unexpected error for pidx {}: {}", pidx, e.getMessage());
            throw new BadRequestException("Failed to verify Khalti payment: " + e.getMessage());
        }
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Key " + secretKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
