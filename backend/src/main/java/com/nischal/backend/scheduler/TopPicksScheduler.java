package com.nischal.backend.scheduler;

import com.nischal.backend.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TopPicksScheduler {

    private final RecommendationService recommendationService;

    /** Every Monday at midnight */
    @Scheduled(cron = "0 0 0 * * MON")
    public void computeWeeklyTopPicks() {
        log.info("Running weekly top picks computation...");
        try {
            recommendationService.computeAndSaveTopPicks();
        } catch (Exception e) {
            log.error("Failed to compute top picks", e);
        }
    }
}
