package com.nischal.backend.service.impl;

import com.nischal.backend.dto.recommendation.TopPickResponse;
import com.nischal.backend.entity.*;
import com.nischal.backend.repository.*;
import com.nischal.backend.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private final TopPickRepository topPickRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TopPickResponse> getCurrentTopPicks() {
        LocalDate weekStart = currentWeekMonday();
        List<TopPick> picks = topPickRepository.findByWeekStartOrderByPickRankAsc(weekStart);
        if (picks.isEmpty()) {
            // Scheduler hasn't run yet — compute on-the-fly and return without persisting
            return computeTopPicksData(weekStart).stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
        return picks.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void computeAndSaveTopPicks() {
        LocalDate weekStart = currentWeekMonday();
        if (topPickRepository.existsByWeekStart(weekStart)) {
            log.info("Top picks for week {} already computed, skipping.", weekStart);
            return;
        }
        List<TopPick> picks = computeTopPicksData(weekStart);
        topPickRepository.saveAll(picks);
        log.info("Saved {} top picks for week {} (1 food + 1 beverage)", picks.size(), weekStart);
    }

    // ── core logic ────────────────────────────────────────────────────────────

    /**
     * Looks at the past 7 days of SERVED orders.
     * Returns exactly 2 picks: rank 1 = top FOOD item, rank 2 = top BEVERAGE item.
     * If no orders exist for a type, that slot is omitted.
     */
    private List<TopPick> computeTopPicksData(LocalDate weekStart) {
        // Window: previous Monday 00:00 → this Monday 00:00
        LocalDateTime windowEnd   = weekStart.atStartOfDay();
        LocalDateTime windowStart = weekStart.minusWeeks(1).atStartOfDay();

        List<Order> orders = orderRepository.findByStatusAndCreatedAtBetween(
                OrderStatus.SERVED, windowStart, windowEnd);

        // Separate tallies for food and beverage
        Map<Long, Integer> foodCounts = new HashMap<>();
        Map<Long, Integer> bevCounts  = new HashMap<>();
        Map<Long, MenuItem> itemMap   = new HashMap<>();

        for (Order order : orders) {
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            for (OrderItem oi : items) {
                MenuItem mi = oi.getMenuItem();
                if (mi == null || Boolean.FALSE.equals(mi.getIsAvailable())) continue;

                Long miId = mi.getId();
                int qty   = oi.getQuantity() != null ? oi.getQuantity() : 1;

                CategoryType type = (mi.getCategory() != null) ? mi.getCategory().getType() : null;
                if (type == CategoryType.BEVERAGE) {
                    bevCounts.merge(miId, qty, Integer::sum);
                } else {
                    foodCounts.merge(miId, qty, Integer::sum);
                }
                itemMap.putIfAbsent(miId, mi);
            }
        }

        List<TopPick> picks = new ArrayList<>();

        // Top food dish (rank 1)
        topEntry(foodCounts).ifPresent(e -> picks.add(TopPick.builder()
                .menuItem(itemMap.get(e.getKey()))
                .weekStart(weekStart)
                .pickRank(1)
                .totalOrdered(e.getValue())
                .score(e.getValue().doubleValue())
                .build()));

        // Top beverage (rank 2)
        topEntry(bevCounts).ifPresent(e -> picks.add(TopPick.builder()
                .menuItem(itemMap.get(e.getKey()))
                .weekStart(weekStart)
                .pickRank(2)
                .totalOrdered(e.getValue())
                .score(e.getValue().doubleValue())
                .build()));

        return picks;
    }

    private Optional<Map.Entry<Long, Integer>> topEntry(Map<Long, Integer> map) {
        return map.entrySet().stream().max(Map.Entry.comparingByValue());
    }

    private LocalDate currentWeekMonday() {
        return LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    private TopPickResponse toResponse(TopPick p) {
        MenuItem mi = p.getMenuItem();
        Category cat = mi.getCategory();
        CategoryType type = cat != null ? cat.getType() : null;
        return TopPickResponse.builder()
                .id(p.getId())
                .menuItemId(mi.getId())
                .menuItemName(mi.getName())
                .menuItemDescription(mi.getDescription())
                .price(mi.getPrice())
                .imageUrl(mi.getImageUrl())
                .categoryName(cat != null ? cat.getName() : null)
                .categoryType(type != null ? type.name() : "FOOD")
                .rank(p.getPickRank())
                .totalOrdered(p.getTotalOrdered())
                .score(p.getScore())
                .weekStart(p.getWeekStart())
                .build();
    }
}
