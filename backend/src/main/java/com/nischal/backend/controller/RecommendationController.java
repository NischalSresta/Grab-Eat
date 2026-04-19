package com.nischal.backend.controller;

import com.nischal.backend.dto.recommendation.TopPickResponse;
import com.nischal.backend.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/top-picks")
    public ResponseEntity<List<TopPickResponse>> getTopPicks() {
        return ResponseEntity.ok(recommendationService.getCurrentTopPicks());
    }

    /** Manual trigger for admins/owners (e.g., after testing) */
    @PostMapping("/top-picks/compute")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> computeNow() {
        recommendationService.computeAndSaveTopPicks();
        return ResponseEntity.ok().build();
    }
}
