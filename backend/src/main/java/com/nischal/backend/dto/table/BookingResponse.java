package com.nischal.backend.dto.table;

import com.nischal.backend.entity.BookingStatus;
import com.nischal.backend.entity.TableFloor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private Long id;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private Long tableId;
    private String tableNumber;
    private Integer tableCapacity;
    private TableFloor tableFloor;
    private String tableQrToken;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer partySize;
    private BookingStatus status;
    private String specialRequests;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
