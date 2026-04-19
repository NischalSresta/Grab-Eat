package com.nischal.backend.dto.loyalty;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateRewardRequest {

    @NotBlank
    @Size(max = 150)
    private String name;

    @Size(max = 500)
    private String description;

    @NotNull
    @Min(1)
    private Integer pointsCost;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal discountAmount;
}
