package com.nischal.backend.dto.table;

import com.nischal.backend.entity.TableFloor;
import com.nischal.backend.entity.TableStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateTableRequest {

    @Size(max = 20, message = "Table number must not exceed 20 characters")
    private String tableNumber;

    @Min(value = 1, message = "Capacity must be at least 1")
    @Max(value = 50, message = "Capacity must not exceed 50")
    private Integer capacity;

    private TableFloor floor;

    private TableStatus status;

    @Size(max = 255, message = "Description must not exceed 255 characters")
    private String description;

    private Boolean isActive;

    @Size(max = 100, message = "Waiter name must not exceed 100 characters")
    private String assignedWaiter;
}
