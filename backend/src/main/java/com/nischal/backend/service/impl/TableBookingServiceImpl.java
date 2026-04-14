package com.nischal.backend.service.impl;

import com.nischal.backend.entity.*;
import com.nischal.backend.exception.BadRequestException;
import com.nischal.backend.exception.ResourceNotFoundException;
import com.nischal.backend.repository.TableBookingRepository;
import com.nischal.backend.repository.RestaurantTableRepository;
import com.nischal.backend.service.TableBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TableBookingServiceImpl implements TableBookingService {

    private final TableBookingRepository bookingRepository;
    private final RestaurantTableRepository tableRepository;

    @Override
    @Transactional
    public TableBooking createBooking(Long tableId, Long userId, String customerName, String customerPhone,
                                      String customerEmail, LocalDate bookingDate, LocalTime startTime,
                                      LocalTime endTime, int guestCount, String specialRequests) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with id: " + tableId));

        if (!isTableAvailable(tableId, bookingDate, startTime, endTime)) {
            throw new BadRequestException("Table is not available for the selected time slot");
        }

        if (guestCount > table.getCapacity()) {
            throw new BadRequestException("Guest count exceeds table capacity of " + table.getCapacity());
        }

        TableBooking booking = TableBooking.builder()
                .table(table)
                .customerName(customerName)
                .customerPhone(customerPhone)
                .customerEmail(customerEmail)
                .bookingDate(bookingDate)
                .startTime(startTime)
                .endTime(endTime)
                .guestCount(guestCount)
                .specialRequests(specialRequests)
                .status(BookingStatus.PENDING)
                .build();

        if (userId != null) {
            User user = new User();
            user.setId(userId);
            booking.setUser(user);
        }

        return bookingRepository.save(booking);
    }

    @Override
    public TableBooking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    @Override
    public List<TableBooking> getBookingsByUser(Long userId) {
        return bookingRepository.findByUserIdOrderByBookingDateDescCreatedAtDesc(userId);
    }

    @Override
    public List<TableBooking> getBookingsByDate(LocalDate date) {
        return bookingRepository.findByBookingDate(date);
    }

    @Override
    public List<TableBooking> getAllBookings() {
        return bookingRepository.findAll();
    }

    @Override
    @Transactional
    public TableBooking updateBookingStatus(Long id, BookingStatus status) {
        TableBooking booking = getBookingById(id);
        booking.setStatus(status);
        return bookingRepository.save(booking);
    }

    @Override
    public boolean isTableAvailable(Long tableId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        List<TableBooking> conflicts = bookingRepository.findConflictingBookings(tableId, date, startTime, endTime);
        return conflicts.isEmpty();
    }

    @Override
    @Transactional
    public void cancelBooking(Long id) {
        TableBooking booking = getBookingById(id);
        if (booking.getStatus() == BookingStatus.CHECKED_IN || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new BadRequestException("Cannot cancel a booking that is already checked in or completed");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }
}
