package com.nischal.backend.repository;

import com.nischal.backend.entity.InventoryLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryLogRepository extends JpaRepository<InventoryLog, Long> {

    List<InventoryLog> findByIngredientIdOrderByCreatedAtDesc(Long ingredientId);

    Page<InventoryLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
