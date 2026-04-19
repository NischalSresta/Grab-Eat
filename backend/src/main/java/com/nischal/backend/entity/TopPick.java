package com.nischal.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "top_picks", indexes = {
        @Index(name = "idx_top_pick_week", columnList = "week_start"),
        @Index(name = "idx_top_pick_menu_item", columnList = "menu_item_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopPick {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    /** Monday of the week this pick is valid for */
    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    /** 1 = most popular, ascending rank */
    @Column(nullable = false)
    private Integer pickRank;

    /** Total quantity sold in the scoring window */
    @Column(nullable = false)
    private Integer totalOrdered;

    /** Weighted score used to determine rank */
    @Column(nullable = false)
    private Double score;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
