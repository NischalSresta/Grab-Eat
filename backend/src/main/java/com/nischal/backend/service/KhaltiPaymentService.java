package com.nischal.backend.service;

import com.nischal.backend.dto.billing.KhaltiInitiateResponse;
import com.nischal.backend.dto.billing.KhaltiLookupResponse;

public interface KhaltiPaymentService {
    KhaltiInitiateResponse initiatePayment(Long orderId, String returnUrl);
    KhaltiLookupResponse lookupPayment(String pidx);
}
