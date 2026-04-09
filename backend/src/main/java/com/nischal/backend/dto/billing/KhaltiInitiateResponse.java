package com.nischal.backend.dto.billing;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KhaltiInitiateResponse {
    private String pidx;
    private String paymentUrl;
    private String expiresAt;
    private Integer expiresIn;
}
