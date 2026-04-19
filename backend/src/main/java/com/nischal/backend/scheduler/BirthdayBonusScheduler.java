package com.nischal.backend.scheduler;

import com.nischal.backend.entity.User;
import com.nischal.backend.repository.UserRepository;
import com.nischal.backend.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BirthdayBonusScheduler {

    private final UserRepository userRepository;
    private final LoyaltyService loyaltyService;

    /** Runs every day at 8 AM */
    @Scheduled(cron = "0 0 8 * * *")
    public void awardDailyBirthdayBonuses() {
        LocalDate today = LocalDate.now();
        List<User> birthdayUsers = userRepository.findByBirthDateMonthAndDay(
                today.getMonthValue(), today.getDayOfMonth());
        for (User user : birthdayUsers) {
            try {
                loyaltyService.awardBirthdayBonus(user.getId());
            } catch (Exception e) {
                log.error("Failed to award birthday bonus to user {}", user.getId(), e);
            }
        }
        if (!birthdayUsers.isEmpty()) {
            log.info("Awarded birthday bonuses to {} user(s)", birthdayUsers.size());
        }
    }
}
