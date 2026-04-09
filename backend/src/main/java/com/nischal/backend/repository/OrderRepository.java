package com.nischal.backend.repository;

import com.nischal.backend.entity.Order;
import com.nischal.backend.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByTableIdOrderByCreatedAtDesc(Long tableId);

    List<Order> findByStatusOrderByCreatedAtAsc(OrderStatus status);

    List<Order> findBySessionTokenOrderByCreatedAtDesc(String sessionToken);

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT o FROM Order o WHERE o.status NOT IN ('SERVED', 'CANCELLED') ORDER BY o.createdAt ASC")
    List<Order> findAllActiveOrders();

    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :from AND :to ORDER BY o.createdAt DESC")
    List<Order> findByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    List<Order> findByStatusAndCreatedAtBetween(OrderStatus status, LocalDateTime from, LocalDateTime to);

    Optional<Order> findByKhaltiPidx(String khaltiPidx);
}
