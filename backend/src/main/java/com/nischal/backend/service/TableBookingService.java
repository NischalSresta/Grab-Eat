package com.nischal.backend.service;

import com.nischal.backend.dto.table.BookingResponse;
import com.nischal.backend.dto.table.CreateBookingRequest;
import com.nischal.backend.dto.user.PageResponse;

import org.springframework.data.domain.Pageable;
import java.util.List;

public interface TableBookingService {

    BookingResponse createBooking(Long userId, CreateBookingRequest request);

    BookingResponse getBookingById(Long bookingId, Long requestingUserId);

    PageResponse<BookingResponse> getUserBookings(Long userId, Pageable pageable);

    BookingResponse cancelBooking(Long bookingId, Long requestingUserId);

    // Admin operations
    PageResponse<BookingResponse> getAllBookings(Pageable pageable);

    List<BookingResponse> getBookingsByTable(Long tableId);

    List<BookingResponse> getActiveBookings();

    BookingResponse confirmBooking(Long bookingId);

    BookingResponse completeBooking(Long bookingId);

    BookingResponse adminCancelBooking(Long bookingId);
}
