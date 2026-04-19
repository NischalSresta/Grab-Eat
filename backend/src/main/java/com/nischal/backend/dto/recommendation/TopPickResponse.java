package com.nischal.backend.dto.recommendation;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TopPickResponse {
    private Long id;
    private Long menuItemId;
    private String menuItemName;
    private String menuItemDescription;
    private BigDecimal price;
    private String imageUrl;
    private String categoryName;
    private Integer rank;
    private Integer totalOrdered;
    private Double score;
    private LocalDate weekStart;
}
