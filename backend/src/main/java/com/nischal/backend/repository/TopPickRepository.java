package com.nischal.backend.repository;

import com.nischal.backend.entity.TopPick;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TopPickRepository extends JpaRepository<TopPick, Long> {

    List<TopPick> findByWeekStartOrderByPickRankAsc(LocalDate weekStart);

    void deleteByWeekStart(LocalDate weekStart);

    boolean existsByWeekStart(LocalDate weekStart);
}
