package com.nischal.backend.service.impl;

import com.nischal.backend.dto.loyalty.*;
import com.nischal.backend.entity.*;
import com.nischal.backend.exception.BadRequestException;
import com.nischal.backend.exception.ResourceNotFoundException;
import com.nischal.backend.repository.*;
import com.nischal.backend.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoyaltyServiceImpl implements LoyaltyService {

    /** 1 point per NPR 10 spent */
    private static final BigDecimal POINTS_PER_UNIT = new BigDecimal("10");
    private static final int BIRTHDAY_BONUS = 100;

    private final LoyaltyAccountRepository loyaltyAccountRepository;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final RewardRepository rewardRepository;
    private final UserRepository userRepository;

    // Account

    @Override
    @Transactional
    public LoyaltyAccountResponse getMyAccount(String userEmail) {
        User user = findUserOrThrow(userEmail);
        LoyaltyAccount account = loyaltyAccountRepository.findByUserId(user.getId())
                .orElseGet(() -> createAccount(user));
        return toAccountResponse(account);
    }

    @Override
    @Transactional
    public List<LoyaltyTransactionResponse> getMyHistory(String userEmail) {
        User user = findUserOrThrow(userEmail);
        LoyaltyAccount account = loyaltyAccountRepository.findByUserId(user.getId())
                .orElseGet(() -> createAccount(user));
        return loyaltyTransactionRepository
                .findByLoyaltyAccountIdOrderByCreatedAtDesc(account.getId())
                .stream().map(this::toTransactionResponse).collect(Collectors.toList());
    }

    // Earning points

    @Override
    @Transactional
    public void earnPointsForOrder(Order order) {
        if (order.getUser() == null) return;

        LoyaltyAccount account = loyaltyAccountRepository.findByUserId(order.getUser().getId())
                .orElseGet(() -> createAccount(order.getUser()));

        BigDecimal total = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        int points = total.divide(POINTS_PER_UNIT, 0, RoundingMode.FLOOR).intValue();
        if (points <= 0) return;

        account.setCurrentPoints(account.getCurrentPoints() + points);
        account.setLifetimePoints(account.getLifetimePoints() + points);
        loyaltyAccountRepository.save(account);

        LoyaltyTransaction tx = LoyaltyTransaction.builder()
                .loyaltyAccount(account)
                .type(LoyaltyTransactionType.EARNED)
                .pointsChange(points)
                .balanceAfter(account.getCurrentPoints())
                .order(order)
                .description("Earned " + points + " points for order #" + order.getId())
                .build();
        loyaltyTransactionRepository.save(tx);
        log.info("Awarded {} loyalty points to user {} for order #{}", points, order.getUser().getEmail(), order.getId());
    }

    // Redeeming rewards

    @Override
    @Transactional
    public LoyaltyAccountResponse redeemReward(String userEmail, Long rewardId) {
        User user = findUserOrThrow(userEmail);
        LoyaltyAccount account = loyaltyAccountRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Loyalty account not found"));
        Reward reward = rewardRepository.findById(rewardId)
                .orElseThrow(() -> new ResourceNotFoundException("Reward not found: " + rewardId));

        if (!reward.getIsActive()) {
            throw new BadRequestException("Reward '" + reward.getName() + "' is no longer available.");
        }
        if (account.getCurrentPoints() < reward.getPointsCost()) {
            throw new BadRequestException("Insufficient points. You have "
                    + account.getCurrentPoints() + " but need " + reward.getPointsCost() + ".");
        }

        account.setCurrentPoints(account.getCurrentPoints() - reward.getPointsCost());
        loyaltyAccountRepository.save(account);

        LoyaltyTransaction tx = LoyaltyTransaction.builder()
                .loyaltyAccount(account)
                .type(LoyaltyTransactionType.REDEEMED)
                .pointsChange(-reward.getPointsCost())
                .balanceAfter(account.getCurrentPoints())
                .description("Redeemed reward: " + reward.getName())
                .build();
        loyaltyTransactionRepository.save(tx);

        return toAccountResponse(account);
    }

    // Birthday bonus

    @Override
    @Transactional
    public void awardBirthdayBonus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        LoyaltyAccount account = loyaltyAccountRepository.findByUserId(userId)
                .orElseGet(() -> createAccount(user));

        account.setCurrentPoints(account.getCurrentPoints() + BIRTHDAY_BONUS);
        account.setLifetimePoints(account.getLifetimePoints() + BIRTHDAY_BONUS);
        loyaltyAccountRepository.save(account);

        LoyaltyTransaction tx = LoyaltyTransaction.builder()
                .loyaltyAccount(account)
                .type(LoyaltyTransactionType.BONUS)
                .pointsChange(BIRTHDAY_BONUS)
                .balanceAfter(account.getCurrentPoints())
                .description("Happy Birthday! Bonus " + BIRTHDAY_BONUS + " points")
                .build();
        loyaltyTransactionRepository.save(tx);
        log.info("Birthday bonus awarded to user {}", user.getEmail());
    }

    // Rewards catalogue

    @Override
    @Transactional(readOnly = true)
    public List<RewardResponse> getAvailableRewards() {
        return rewardRepository.findByIsActiveTrueOrderByPointsCostAsc()
                .stream().map(this::toRewardResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RewardResponse createReward(CreateRewardRequest request) {
        Reward reward = Reward.builder()
                .name(request.getName())
                .description(request.getDescription())
                .pointsCost(request.getPointsCost())
                .discountAmount(request.getDiscountAmount())
                .build();
        return toRewardResponse(rewardRepository.save(reward));
    }

    @Override
    @Transactional
    public void deleteReward(Long rewardId) {
        Reward reward = rewardRepository.findById(rewardId)
                .orElseThrow(() -> new ResourceNotFoundException("Reward not found: " + rewardId));
        reward.setIsActive(false);
        rewardRepository.save(reward);
    }

    // Helpers

    private LoyaltyAccount createAccount(User user) {
        LoyaltyAccount account = LoyaltyAccount.builder().user(user).build();
        return loyaltyAccountRepository.save(account);
    }

    private User findUserOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private String getTier(int lifetimePoints) {
        if (lifetimePoints >= 1000) return "GOLD";
        if (lifetimePoints >= 500) return "SILVER";
        return "BRONZE";
    }

    private LoyaltyAccountResponse toAccountResponse(LoyaltyAccount a) {
        return LoyaltyAccountResponse.builder()
                .id(a.getId())
                .userId(a.getUser().getId())
                .userEmail(a.getUser().getEmail())
                .userName(a.getUser().getFullName())
                .currentPoints(a.getCurrentPoints())
                .lifetimePoints(a.getLifetimePoints())
                .tier(getTier(a.getLifetimePoints()))
                .build();
    }

    private LoyaltyTransactionResponse toTransactionResponse(LoyaltyTransaction t) {
        return LoyaltyTransactionResponse.builder()
                .id(t.getId())
                .type(t.getType())
                .pointsChange(t.getPointsChange())
                .balanceAfter(t.getBalanceAfter())
                .orderId(t.getOrder() != null ? t.getOrder().getId() : null)
                .description(t.getDescription())
                .createdAt(t.getCreatedAt())
                .build();
    }

    private RewardResponse toRewardResponse(Reward r) {
        return RewardResponse.builder()
                .id(r.getId())
                .name(r.getName())
                .description(r.getDescription())
                .pointsCost(r.getPointsCost())
                .discountAmount(r.getDiscountAmount())
                .isActive(r.getIsActive())
                .build();
    }
}
