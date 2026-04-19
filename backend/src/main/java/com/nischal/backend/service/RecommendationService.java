package com.nischal.backend.service;

import com.nischal.backend.dto.recommendation.TopPickResponse;

import java.util.List;

public interface RecommendationService {

    /** Returns current week's top picks (up to 5). */
    List<TopPickResponse> getCurrentTopPicks();

    /** Computes and persists top picks for the current week. Called by scheduler. */
    void computeAndSaveTopPicks();
}
