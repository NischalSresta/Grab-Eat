package com.nischal.backend.controller;

import com.nischal.backend.dto.table.BookingResponse;
import com.nischal.backend.dto.table.CreateBookingRequest;
import com.nischal.backend.dto.user.PageResponse;
import com.nischal.backend.service.TableBookingService;
import java.util.List;
import com.nischal.backend.service.userdetails.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class TableBookingController {

    private final TableBookingService bookingService;

    /**
     * Customer creates a booking.
     */
    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            Authentication authentication,
            @Valid @RequestBody CreateBookingRequest request
    ) {
        Long userId = getUserId(authentication);
        BookingResponse response = bookingService.createBooking(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Customer views a specific booking (must be theirs).
     */
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBookingById(
            Authentication authentication,
            @PathVariable Long id
    ) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(bookingService.getBookingById(id, userId));
    }

    /**
     * Customer views their own bookings (paginated).
     */
    @GetMapping("/my")
    public ResponseEntity<PageResponse<BookingResponse>> getMyBookings(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Long userId = getUserId(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(bookingService.getUserBookings(userId, pageable));
    }

    /**
     * Customer cancels their own booking.
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(
            Authentication authentication,
            @PathVariable Long id
    ) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(bookingService.cancelBooking(id, userId));
    }

    // Admin operations

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<PageResponse<BookingResponse>> getAllBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(bookingService.getAllBookings(pageable));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<List<BookingResponse>> getActiveBookings() {
        return ResponseEntity.ok(bookingService.getActiveBookings());
    }

    @GetMapping("/table/{tableId}")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<List<BookingResponse>> getBookingsByTable(@PathVariable Long tableId) {
        return ResponseEntity.ok(bookingService.getBookingsByTable(tableId));
    }

    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<BookingResponse> confirmBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.confirmBooking(id));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<BookingResponse> completeBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.completeBooking(id));
    }

    @PatchMapping("/{id}/admin-cancel")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<BookingResponse> adminCancelBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.adminCancelBooking(id));
    }

    private Long getUserId(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return userDetails.getUserId();
    }
}
