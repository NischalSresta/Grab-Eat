package com.nischal.backend.dto.table;

import com.nischal.backend.entity.TableFloor;
import com.nischal.backend.entity.TableStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TableResponse {
    private Long id;
    private String tableNumber;
    private Integer capacity;
    private TableFloor floor;
    private TableStatus status;
    private String description;
    private String assignedWaiter;
    private Boolean isActive;
    private String qrToken;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
