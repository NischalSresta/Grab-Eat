package com.nischal.backend.controller;

import com.nischal.backend.dto.loyalty.*;
import com.nischal.backend.service.LoyaltyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LoyaltyAccountResponse> getMyAccount(Authentication auth) {
        return ResponseEntity.ok(loyaltyService.getMyAccount(auth.getName()));
    }

    @GetMapping("/me/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<LoyaltyTransactionResponse>> getMyHistory(Authentication auth) {
        return ResponseEntity.ok(loyaltyService.getMyHistory(auth.getName()));
    }

    @PostMapping("/redeem/{rewardId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LoyaltyAccountResponse> redeemReward(
            @PathVariable Long rewardId,
            Authentication auth) {
        return ResponseEntity.ok(loyaltyService.redeemReward(auth.getName(), rewardId));
    }

    @GetMapping("/rewards")
    public ResponseEntity<List<RewardResponse>> getAvailableRewards() {
        return ResponseEntity.ok(loyaltyService.getAvailableRewards());
    }

    @PostMapping("/rewards")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<RewardResponse> createReward(@Valid @RequestBody CreateRewardRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(loyaltyService.createReward(request));
    }

    @DeleteMapping("/rewards/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteReward(@PathVariable Long id) {
        loyaltyService.deleteReward(id);
        return ResponseEntity.noContent().build();
    }
}
