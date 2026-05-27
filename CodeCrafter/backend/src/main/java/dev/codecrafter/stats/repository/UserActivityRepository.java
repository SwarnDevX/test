package dev.codecrafter.stats.repository;

import dev.codecrafter.stats.entity.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {

    Optional<UserActivity> findByUserIdAndActivityDate(Long userId, LocalDate date);

    @Query("SELECT a FROM UserActivity a WHERE a.user.id = :userId AND a.activityDate >= :from ORDER BY a.activityDate ASC")
    List<UserActivity> findByUserIdSince(Long userId, LocalDate from);

    @Query("SELECT a.activityDate FROM UserActivity a WHERE a.user.id = :userId AND a.acCount > 0 ORDER BY a.activityDate DESC")
    List<LocalDate> findActiveDates(Long userId);
}
