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

    private static final int TOP_N = 5;
    /** Weights for weeks: index 0 = most recent week, index 3 = oldest */
    private static final int[] WEEK_WEIGHTS = {4, 3, 2, 1};

    private final TopPickRepository topPickRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TopPickResponse> getCurrentTopPicks() {
        LocalDate weekStart = currentWeekMonday();
        List<TopPick> picks = topPickRepository.findByWeekStartOrderByPickRankAsc(weekStart);
        if (picks.isEmpty()) {
            // Fallback: compute on-the-fly if scheduler hasn't run yet
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
        log.info("Saved {} top picks for week {}", picks.size(), weekStart);
    }

    // Helpers

    private List<TopPick> computeTopPicksData(LocalDate weekStart) {
        LocalDateTime windowEnd = weekStart.atStartOfDay();
        LocalDateTime windowStart = weekStart.minusWeeks(4).atStartOfDay();

        // Fetch all SERVED orders in the 4-week window
        List<Order> orders = orderRepository.findByStatusAndCreatedAtBetween(
                OrderStatus.SERVED, windowStart, windowEnd);

        // Map: menuItemId -> weighted score
        Map<Long, Double> scoreMap = new HashMap<>();
        Map<Long, Integer> totalMap = new HashMap<>();
        Map<Long, MenuItem> itemMap = new HashMap<>();

        for (Order order : orders) {
            // Determine how many weeks ago this order was (0 = most recent week)
            long weeksAgo = Duration.between(order.getCreatedAt(), windowEnd).toDays() / 7;
            int weight = (weeksAgo < WEEK_WEIGHTS.length) ? WEEK_WEIGHTS[(int) weeksAgo] : 1;

            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            for (OrderItem item : items) {
                MenuItem mi = item.getMenuItem();
                if (mi == null || !mi.getIsAvailable()) continue;
                Long miId = mi.getId();
                int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                scoreMap.merge(miId, (double) qty * weight, Double::sum);
                totalMap.merge(miId, qty, Integer::sum);
                itemMap.putIfAbsent(miId, mi);
            }
        }

        // Sort by score descending, take top N
        List<Map.Entry<Long, Double>> sorted = new ArrayList<>(scoreMap.entrySet());
        sorted.sort(Map.Entry.<Long, Double>comparingByValue().reversed());

        List<TopPick> picks = new ArrayList<>();
        int rank = 1;
        for (Map.Entry<Long, Double> entry : sorted) {
            if (rank > TOP_N) break;
            Long miId = entry.getKey();
            TopPick pick = TopPick.builder()
                    .menuItem(itemMap.get(miId))
                    .weekStart(weekStart)
                    .pickRank(rank)
                    .totalOrdered(totalMap.getOrDefault(miId, 0))
                    .score(entry.getValue())
                    .build();
            picks.add(pick);
            rank++;
        }
        return picks;
    }

    private LocalDate currentWeekMonday() {
        return LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    private TopPickResponse toResponse(TopPick p) {
        MenuItem mi = p.getMenuItem();
        return TopPickResponse.builder()
                .id(p.getId())
                .menuItemId(mi.getId())
                .menuItemName(mi.getName())
                .menuItemDescription(mi.getDescription())
                .price(mi.getPrice())
                .imageUrl(mi.getImageUrl())
                .categoryName(mi.getCategory() != null ? mi.getCategory().getName() : null)
                .rank(p.getPickRank())
                .totalOrdered(p.getTotalOrdered())
                .score(p.getScore())
                .weekStart(p.getWeekStart())
                .build();
    }

}
