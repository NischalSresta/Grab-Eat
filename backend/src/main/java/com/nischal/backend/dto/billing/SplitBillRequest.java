package com.nischal.backend.dto.billing;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SplitBillRequest {

    @NotNull
    @Min(value = 2, message = "Must split between at least 2 people")
    private Integer numberOfPeople;
}
