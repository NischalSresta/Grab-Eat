package com.nischal.backend.service;

import com.nischal.backend.entity.BookingStatus;
import com.nischal.backend.entity.TableBooking;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface TableBookingService {

    TableBooking createBooking(Long tableId, Long userId, String customerName, String customerPhone,
                               String customerEmail, LocalDate bookingDate, LocalTime startTime,
                               LocalTime endTime, int guestCount, String specialRequests);

    TableBooking getBookingById(Long id);

    List<TableBooking> getBookingsByUser(Long userId);

    List<TableBooking> getBookingsByDate(LocalDate date);

    List<TableBooking> getAllBookings();

    TableBooking updateBookingStatus(Long id, BookingStatus status);

    boolean isTableAvailable(Long tableId, LocalDate date, LocalTime startTime, LocalTime endTime);

    void cancelBooking(Long id);
}
