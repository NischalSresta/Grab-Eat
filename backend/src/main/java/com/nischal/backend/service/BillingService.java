package com.nischal.backend.service;

import com.nischal.backend.dto.billing.*;

public interface BillingService {
    BillResponse getBill(Long orderId);
    BillResponse processPayment(Long orderId, ProcessPaymentRequest request, String performedBy);
    SplitBillResponse splitBill(Long orderId, SplitBillRequest request);

    /** Initiates a Khalti payment for the order and returns pidx + payment URL. */
    KhaltiInitiateResponse initiateKhaltiPayment(Long orderId, String returnUrl);

    /** Verifies a Khalti payment by pidx; marks order PAID if status is Completed. */
    BillResponse verifyKhaltiPayment(KhaltiVerifyRequest request);

    /** Customer requests to pay with cash — notifies staff via WebSocket. */
    void requestCashPayment(Long orderId);

    /** Staff confirms cash was received — marks order PAID and awards loyalty points. */
    BillResponse confirmCashPayment(Long orderId, String performedBy);
}
