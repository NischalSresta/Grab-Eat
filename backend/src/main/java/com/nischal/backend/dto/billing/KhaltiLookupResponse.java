package com.nischal.backend.dto.billing;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

/** Maps the JSON response from Khalti's /epayment/lookup/ endpoint. */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KhaltiLookupResponse {

    private String pidx;

    @JsonProperty("total_amount")
    private Long totalAmount;

    /** Completed | Pending | Initiated | Refunded | Expired | User canceled */
    private String status;

    @JsonProperty("transaction_id")
    private String transactionId;

    private Long fee;
    private Boolean refunded;
}
