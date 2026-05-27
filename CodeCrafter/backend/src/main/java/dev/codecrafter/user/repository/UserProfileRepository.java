package dev.codecrafter.user.repository;

import dev.codecrafter.user.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    Optional<UserProfile> findByUserId(Long userId);

    @Query("SELECT p FROM UserProfile p JOIN p.user u WHERE u.username = :username")
    Optional<UserProfile> findByUsername(String username);
}
