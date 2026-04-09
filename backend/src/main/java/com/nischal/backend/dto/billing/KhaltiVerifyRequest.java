package com.nischal.backend.dto.billing;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KhaltiVerifyRequest {

    @NotBlank(message = "pidx is required")
    private String pidx;
}
