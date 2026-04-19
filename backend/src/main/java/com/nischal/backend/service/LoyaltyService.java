package com.nischal.backend.service;

import com.nischal.backend.dto.loyalty.*;
import com.nischal.backend.entity.Order;

import java.util.List;

public interface LoyaltyService {

    /** Get or create loyalty account for the authenticated user */
    LoyaltyAccountResponse getMyAccount(String userEmail);

    /** Points history for the authenticated user */
    List<LoyaltyTransactionResponse> getMyHistory(String userEmail);

    /** Auto-called after order payment to award points */
    void earnPointsForOrder(Order order);

    /** Redeem a reward (deduct points) */
    LoyaltyAccountResponse redeemReward(String userEmail, Long rewardId);

    /** Award birthday bonus (called by scheduler) */
    void awardBirthdayBonus(Long userId);

    // Rewards catalogue
    List<RewardResponse> getAvailableRewards();
    RewardResponse createReward(CreateRewardRequest request);
    void deleteReward(Long rewardId);
}
