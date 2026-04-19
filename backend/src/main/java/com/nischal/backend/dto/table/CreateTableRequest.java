package com.nischal.backend.dto.table;

import com.nischal.backend.entity.TableFloor;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateTableRequest {

    @NotBlank(message = "Table number is required")
    @Size(max = 20, message = "Table number must not exceed 20 characters")
    private String tableNumber;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    @Max(value = 50, message = "Capacity must not exceed 50")
    private Integer capacity;

    @NotNull(message = "Floor is required")
    private TableFloor floor;

    @Size(max = 255, message = "Description must not exceed 255 characters")
    private String description;
}
