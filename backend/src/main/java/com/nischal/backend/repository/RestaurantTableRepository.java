package com.nischal.backend.repository;

import com.nischal.backend.entity.RestaurantTable;
import com.nischal.backend.entity.TableFloor;
import com.nischal.backend.entity.TableStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {

    List<RestaurantTable> findByIsActiveTrue();

    List<RestaurantTable> findByFloorAndIsActiveTrue(TableFloor floor);

    List<RestaurantTable> findByStatusAndIsActiveTrue(TableStatus status);

    List<RestaurantTable> findByFloorAndStatusAndIsActiveTrue(TableFloor floor, TableStatus status);

    List<RestaurantTable> findByCapacityGreaterThanEqualAndIsActiveTrue(Integer minCapacity);

    boolean existsByTableNumber(String tableNumber);

    Optional<RestaurantTable> findByQrToken(String qrToken);

    @Transactional
    @Modifying
    @Query(value = "UPDATE restaurant_tables SET floor = 'INDOOR' WHERE floor IN ('GROUND', 'FIRST', 'SECOND')", nativeQuery = true)
    void migrateOldFloorValuesToIndoor();

    @Transactional
    @Modifying
    @Query(value = "UPDATE restaurant_tables SET status = 'MAINTENANCE' WHERE status = 'OUT_OF_SERVICE'", nativeQuery = true)
    void migrateOutOfServiceStatusToMaintenance();

    // Find tables that are NOT booked (no overlapping confirmed/pending booking) on a given date+time
    @Query("""
        SELECT t FROM RestaurantTable t
        WHERE t.isActive = true
          AND t.capacity >= :minCapacity
          AND t.id NOT IN (
              SELECT b.table.id FROM TableBooking b
              WHERE b.bookingDate = :bookingDate
                AND b.status IN ('PENDING', 'CONFIRMED')
                AND b.startTime < :endTime
                AND b.endTime > :startTime
          )
        ORDER BY t.floor, t.capacity
    """)
    List<RestaurantTable> findAvailableTables(
            @Param("bookingDate") LocalDate bookingDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("minCapacity") Integer minCapacity
    );

    @Query("""
        SELECT t FROM RestaurantTable t
        WHERE t.isActive = true
          AND t.floor = :floor
          AND t.capacity >= :minCapacity
          AND t.id NOT IN (
              SELECT b.table.id FROM TableBooking b
              WHERE b.bookingDate = :bookingDate
                AND b.status IN ('PENDING', 'CONFIRMED')
                AND b.startTime < :endTime
                AND b.endTime > :startTime
          )
        ORDER BY t.capacity
    """)
    List<RestaurantTable> findAvailableTablesByFloor(
            @Param("bookingDate") LocalDate bookingDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("minCapacity") Integer minCapacity,
            @Param("floor") TableFloor floor
    );
}
