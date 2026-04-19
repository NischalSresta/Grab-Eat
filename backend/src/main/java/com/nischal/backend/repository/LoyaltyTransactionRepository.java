package com.nischal.backend.repository;

import com.nischal.backend.entity.LoyaltyTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoyaltyTransactionRepository extends JpaRepository<LoyaltyTransaction, Long> {
    List<LoyaltyTransaction> findByLoyaltyAccountIdOrderByCreatedAtDesc(Long loyaltyAccountId);
}
