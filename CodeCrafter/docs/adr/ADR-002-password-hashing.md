# ADR-002: Password Hashing — Argon2id

**Status:** Accepted  
**Date:** 2024-11  
**Deciders:** Security review

## Context

We need to choose a password hashing algorithm. Options evaluated:

1. **BCrypt** — Spring Security default, widely used, intentionally slow
2. **SCrypt** — memory-hard, good but less standardized
3. **Argon2id** — winner of the Password Hashing Competition (2015), OWASP recommended

## Decision

Use **Argon2id** via Spring Security's `Argon2PasswordEncoder`.

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
}
```

Parameters (Spring Security defaults): `m=16384 KiB, t=2, p=1`

## Rationale

- **OWASP recommendation:** Argon2id is OWASP's first choice for new systems (PHC winner).
- **Memory-hard:** Argon2id resists GPU/ASIC brute-force attacks better than BCrypt, which is only CPU-bound.
- **Hybrid attack resistance:** The `id` variant combines Argon2i (side-channel resistance) and Argon2d (GPU resistance).
- **Spring Security support:** Native support via `org.springframework.security.crypto.argon2.Argon2PasswordEncoder` — no third-party library needed beyond Bouncy Castle (already a transitive dependency).

## Consequences

- Requires `org.bouncycastle:bcpkix-jdk18on` on the classpath (explicit dependency added).
- Hash computation is ~100ms on typical hardware, which is acceptable for auth endpoints.
- Hashes are stored as `$argon2id$...` encoded strings, portable across any Argon2-compatible system.
- Argon2id is the non-negotiable choice per Section 7 of the product spec.
