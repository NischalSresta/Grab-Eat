package com.nischal.backend.repository;

import com.nischal.backend.entity.BookingStatus;
import com.nischal.backend.entity.TableBooking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface TableBookingRepository extends JpaRepository<TableBooking, Long> {

    Page<TableBooking> findByUserId(Long userId, Pageable pageable);

    List<TableBooking> findByUserIdAndStatus(Long userId, BookingStatus status);

    Page<TableBooking> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<TableBooking> findByStatus(BookingStatus status, Pageable pageable);

    List<TableBooking> findByTableIdAndBookingDate(Long tableId, LocalDate bookingDate);

    List<TableBooking> findByTableIdOrderByCreatedAtDesc(Long tableId);

    List<TableBooking> findByStatusIn(List<BookingStatus> statuses);

    // Check for conflicting bookings on a specific table
    @Query("""
        SELECT COUNT(b) > 0 FROM TableBooking b
        WHERE b.table.id = :tableId
          AND b.bookingDate = :bookingDate
          AND b.status IN ('PENDING', 'CONFIRMED')
          AND b.startTime < :endTime
          AND b.endTime > :startTime
          AND (:excludeBookingId IS NULL OR b.id <> :excludeBookingId)
    """)
    boolean existsConflictingBooking(
            @Param("tableId") Long tableId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeBookingId") Long excludeBookingId
    );

    long countByUserIdAndStatus(Long userId, BookingStatus status);

    boolean existsByTableIdAndStatusIn(Long tableId, List<BookingStatus> statuses);
}
