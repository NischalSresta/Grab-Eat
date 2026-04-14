package com.nischal.backend.repository;

import com.nischal.backend.entity.BookingStatus;
import com.nischal.backend.entity.TableBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface TableBookingRepository extends JpaRepository<TableBooking, Long> {

    List<TableBooking> findByUserId(Long userId);

    List<TableBooking> findByTableId(Long tableId);

    List<TableBooking> findByBookingDate(LocalDate date);

    List<TableBooking> findByStatus(BookingStatus status);

    List<TableBooking> findByBookingDateAndStatus(LocalDate date, BookingStatus status);

    @Query("SELECT b FROM TableBooking b WHERE b.table.id = :tableId " +
           "AND b.bookingDate = :date " +
           "AND b.status NOT IN ('CANCELLED', 'NO_SHOW') " +
           "AND (b.startTime < :endTime AND b.endTime > :startTime)")
    List<TableBooking> findConflictingBookings(
            @Param("tableId") Long tableId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    List<TableBooking> findByUserIdOrderByBookingDateDescCreatedAtDesc(Long userId);
}
