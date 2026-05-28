package dev.codecrafter.challenge.repository;

import dev.codecrafter.challenge.entity.DailyChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface DailyChallengeRepository extends JpaRepository<DailyChallenge, Long> {
    Optional<DailyChallenge> findByChallengeDate(LocalDate date);
}
