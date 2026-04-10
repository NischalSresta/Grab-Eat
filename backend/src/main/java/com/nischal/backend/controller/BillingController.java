package com.nischal.backend.controller;

import com.nischal.backend.dto.billing.*;
import com.nischal.backend.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    /** Get the bill/receipt for an order */
    @GetMapping("/{orderId}")
    public ResponseEntity<BillResponse> getBill(@PathVariable Long orderId) {
        return ResponseEntity.ok(billingService.getBill(orderId));
    }

    /** Process payment for an order (staff/owner) */
    @PostMapping("/{orderId}/pay")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<BillResponse> processPayment(
            @PathVariable Long orderId,
            @Valid @RequestBody ProcessPaymentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                billingService.processPayment(orderId, request, userDetails.getUsername()));
    }

    /** Calculate per-person amount for split bill */
    @PostMapping("/{orderId}/split")
    public ResponseEntity<SplitBillResponse> splitBill(
            @PathVariable Long orderId,
            @Valid @RequestBody SplitBillRequest request) {
        return ResponseEntity.ok(billingService.splitBill(orderId, request));
    }

    /**
     * Initiate a Khalti payment for an order (staff/owner only).
     * Returns a pidx and payment_url to redirect the customer.
     */
    @PostMapping("/{orderId}/khalti/initiate")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<KhaltiInitiateResponse> initiateKhaltiPayment(
            @PathVariable Long orderId,
            @RequestParam(defaultValue = "http://localhost:5173/payment/callback") String returnUrl) {
        return ResponseEntity.ok(billingService.initiateKhaltiPayment(orderId, returnUrl));
    }

    /**
     * Customer-facing: initiate Khalti payment directly (no auth required).
     * Customers call this from the order tracker after their food is served.
     */
    @PostMapping("/{orderId}/khalti/pay")
    public ResponseEntity<KhaltiInitiateResponse> customerInitiateKhaltiPayment(
            @PathVariable Long orderId,
            @RequestParam(defaultValue = "http://localhost:5173/payment/callback") String returnUrl) {
        return ResponseEntity.ok(billingService.initiateKhaltiPayment(orderId, returnUrl));
    }

    /**
     * Verify a Khalti payment using the pidx received in the callback.
     * Public — the frontend callback page calls this after Khalti redirects.
     */
    @PostMapping("/khalti/verify")
    public ResponseEntity<BillResponse> verifyKhaltiPayment(
            @Valid @RequestBody KhaltiVerifyRequest request) {
        return ResponseEntity.ok(billingService.verifyKhaltiPayment(request));
    }

    /**
     * Customer requests to pay with cash.
     * Notifies staff via WebSocket — does NOT mark order as paid.
     */
    @PostMapping("/{orderId}/cash/request")
    public ResponseEntity<Void> requestCashPayment(@PathVariable Long orderId) {
        billingService.requestCashPayment(orderId);
        return ResponseEntity.ok().build();
    }

    /**
     * Staff confirms cash was physically received.
     * Marks order PAID, awards loyalty points, broadcasts WebSocket update.
     */
    @PostMapping("/{orderId}/cash/confirm")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<BillResponse> confirmCashPayment(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(billingService.confirmCashPayment(orderId, userDetails.getUsername()));
    }
}
