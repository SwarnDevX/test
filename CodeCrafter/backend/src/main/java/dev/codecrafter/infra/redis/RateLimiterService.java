package dev.codecrafter.infra.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RateLimiterService {

    private final StringRedisTemplate redisTemplate;

    private static final String PREFIX = "rate:";

    /**
     * Sliding window rate limiter using Redis sorted sets.
     * Returns true if the request is allowed, false if the rate limit is exceeded.
     */
    public boolean isAllowed(String key, int maxRequests, Duration window) {
        String redisKey = PREFIX + key;
        long nowMs = System.currentTimeMillis();
        long windowStartMs = nowMs - window.toMillis();

        // Remove entries outside the window
        redisTemplate.opsForZSet().removeRangeByScore(redisKey, 0, windowStartMs - 1);

        // Count current entries in the window
        Long count = redisTemplate.opsForZSet().zCard(redisKey);
        if (count != null && count >= maxRequests) {
            return false;
        }

        // Add current request (use unique member to avoid collisions at same millisecond)
        String member = nowMs + ":" + Thread.currentThread().getId();
        redisTemplate.opsForZSet().add(redisKey, member, nowMs);
        redisTemplate.expire(redisKey, window);

        return true;
    }

    /**
     * Convenience method for per-IP rate limiting.
     */
    public boolean isIpAllowed(String ip, String endpoint, int max, Duration window) {
        return isAllowed("ip:" + ip + ":" + endpoint, max, window);
    }

    /**
     * Convenience method for per-user rate limiting.
     */
    public boolean isUserAllowed(Long userId, String endpoint, int max, Duration window) {
        return isAllowed("user:" + userId + ":" + endpoint, max, window);
    }
}
