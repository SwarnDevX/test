# ADR-003: Code Execution Sandbox Strategy

**Status:** Accepted  
**Date:** 2024-11  
**Deciders:** Security + infrastructure review

## Context

User-submitted code must execute safely with these guarantees:
1. Cannot access the host filesystem
2. Cannot make outbound network connections
3. Cannot escalate privileges
4. Cannot fork-bomb the host
5. Cannot consume unbounded memory or CPU
6. Cannot observe other users' submissions

Options evaluated:
1. **gVisor** — userspace kernel, excellent isolation, adds ~20ms overhead
2. **Firecracker microVMs** — strongest isolation, complex to operate
3. **Docker + seccomp + cgroups** — standard, well-understood, lower overhead
4. **Podman** — rootless containers, good but less Docker ecosystem tooling

## Decision

Use **Docker with hardened flags + custom seccomp profile** for Phase 0–9.

Flag baseline per submission container:
```
--rm --network=none --read-only
--tmpfs /tmp:size=64m,exec
--memory=256m --memory-swap=256m
--cpus=1.0 --pids-limit=64
--cap-drop=ALL
--security-opt no-new-privileges
--security-opt seccomp=/profiles/judge.json
--user 65534:65534
```

## Rationale

| Approach | Isolation | Overhead | Operational complexity |
|----------|-----------|----------|----------------------|
| Docker + hardened flags | Good | ~50ms | Low |
| gVisor | Excellent | ~20ms extra | Medium |
| Firecracker | Excellent | ~125ms | High |

At our traffic levels (Phase 1–8), Docker + seccomp provides sufficient isolation with much lower operational overhead. The spec explicitly lists Docker as the required approach.

The custom seccomp profile (`infra/seccomp/judge.json`) adds denies on top of the Docker default profile for: `mount`, `ptrace`, `setns`, `unshare`, `socket` (AF_INET, AF_INET6, AF_UNIX, AF_NETLINK), and privilege escalation syscalls.

## Consequences

- Each submission requires spinning up a fresh container (~150–300ms overhead on preheated images).
- Language images are prebuilt and pulled into the host at deploy time — never built per submission.
- The judge worker must run on Linux; Windows/macOS dev machines can mock sandbox responses.
- We will add integration tests (Phase 3) that verify fork bombs, network probes, and file escapes are blocked.
- Migration path: if isolation requirements increase, we can swap in gVisor by changing the container runtime without changing the judge worker code.
