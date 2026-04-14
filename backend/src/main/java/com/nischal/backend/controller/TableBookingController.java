package com.nischal.backend.controller;

import com.nischal.backend.entity.BookingStatus;
import com.nischal.backend.entity.TableBooking;
import com.nischal.backend.service.TableBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class TableBookingController {

    private final TableBookingService bookingService;

    // Customer — create a booking
    @PostMapping
    public ResponseEntity<TableBooking> createBooking(@RequestBody Map<String, Object> request) {
        Long tableId = Long.valueOf(request.get("tableId").toString());
        Long userId = request.get("userId") != null ? Long.valueOf(request.get("userId").toString()) : null;
        String customerName = (String) request.get("customerName");
        String customerPhone = (String) request.get("customerPhone");
        String customerEmail = (String) request.get("customerEmail");
        LocalDate bookingDate = LocalDate.parse((String) request.get("bookingDate"));
        LocalTime startTime = LocalTime.parse((String) request.get("startTime"));
        LocalTime endTime = LocalTime.parse((String) request.get("endTime"));
        int guestCount = Integer.parseInt(request.get("guestCount").toString());
        String specialRequests = (String) request.get("specialRequests");

        return ResponseEntity.ok(bookingService.createBooking(
                tableId, userId, customerName, customerPhone, customerEmail,
                bookingDate, startTime, endTime, guestCount, specialRequests));
    }

    // Customer — get own bookings
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TableBooking>> getBookingsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(bookingService.getBookingsByUser(userId));
    }

    // Customer — cancel a booking
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Map<String, String>> cancelBooking(@PathVariable Long id) {
        bookingService.cancelBooking(id);
        return ResponseEntity.ok(Map.of("message", "Booking cancelled successfully"));
    }

    // Public — check availability
    @GetMapping("/availability")
    public ResponseEntity<Map<String, Boolean>> checkAvailability(
            @RequestParam Long tableId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam String startTime,
            @RequestParam String endTime
    ) {
        boolean available = bookingService.isTableAvailable(
                tableId, date, LocalTime.parse(startTime), LocalTime.parse(endTime));
        return ResponseEntity.ok(Map.of("available", available));
    }

    // Admin — get all bookings
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<List<TableBooking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // Admin — get bookings by date
    @GetMapping("/date/{date}")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<List<TableBooking>> getBookingsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(bookingService.getBookingsByDate(date));
    }

    // Admin — update booking status
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<TableBooking> updateBookingStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request
    ) {
        BookingStatus status = BookingStatus.valueOf(request.get("status"));
        return ResponseEntity.ok(bookingService.updateBookingStatus(id, status));
    }
}
