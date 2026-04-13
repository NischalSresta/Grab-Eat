package com.nischal.backend.repository;

import com.nischal.backend.entity.RestaurantTable;
import com.nischal.backend.entity.TableFloor;
import com.nischal.backend.entity.TableStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {

    List<RestaurantTable> findByFloor(TableFloor floor);

    List<RestaurantTable> findByStatus(TableStatus status);

    Optional<RestaurantTable> findByTableNumber(String tableNumber);

    Optional<RestaurantTable> findByQrToken(String qrToken);

    boolean existsByTableNumber(String tableNumber);
}
