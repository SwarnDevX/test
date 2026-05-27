# Security — Sandbox Threat Model

## Threats & Mitigations

| Threat | Mitigation |
|--------|-----------|
| Outbound network probe | `--network=none` + seccomp denies `socket(AF_INET/6)` |
| Filesystem write outside sandbox | `--read-only` rootfs; `/tmp` only via tmpfs (64 MB) |
| Privilege escalation | `--cap-drop=ALL` + `--security-opt no-new-privileges` + `--user 65534` |
| Fork bomb | `--pids-limit=64` |
| Memory bomb | `--memory=256m --memory-swap=256m` (no swap escape) |
| CPU starvation | `--cpus=1.0` (cgroup quota) |
| Output flooding | stdout capped at 64 KB in harness; container killed after that |
| Infinite loop | Wall-clock timeout enforced by judge worker (SIGKILL after N seconds) |
| Kernel syscall abuse | Custom seccomp profile (`infra/seccomp/judge.json`) |
| Container escape via ptrace | seccomp denies `ptrace` |
| Namespace manipulation | seccomp denies `setns`, `unshare`, `mount` |
| Observing host PIDs | `--pid` not shared (default Docker behavior) |
| Host filesystem access | No volume mounts to the sandbox; harness files written to tmpfs |
| Image tampering | Language images are digest-pinned in production |

## seccomp Profile

The profile in `infra/seccomp/judge.json` starts from `SCMP_ACT_ALLOW` (Docker default baseline) and adds explicit `SCMP_ACT_ERRNO` rules for the following categories:

- **Network:** `socket(AF_INET)`, `socket(AF_INET6)`, `socket(AF_UNIX)`, `socket(AF_NETLINK)`
- **Filesystem:** `mount`, `umount`, `umount2`, `mknod`, `mknodat`, `pivot_root`
- **Namespaces:** `setns`, `unshare`
- **Process inspection:** `ptrace`
- **Privilege:** `setuid`, `setgid`, `setresuid`, `setresgid`, `capset`, `chown`
- **Kernel modules:** `init_module`, `finit_module`, `delete_module`
- **Misc:** `clock_settime`, `reboot`, `kexec_load`, `bpf`, `perf_event_open`

## Security Test Suite (Phase 3)

Located in `judge-worker/src/test/.../sandbox/SandboxSecurityTest.java`:

| Test | Expected result |
|------|----------------|
| `fork_bomb.py` — `os.fork()` loop | Killed within pids-limit; WA/RE verdict |
| `network_probe.py` — `socket.connect(8.8.8.8:53)` | RUNTIME_ERROR (EPERM from seccomp) |
| `file_write_root.py` — `open('/etc/passwd', 'w')` | RUNTIME_ERROR (read-only FS) |
| `infinite_loop.py` — `while True: pass` | TIME_LIMIT_EXCEEDED within wall-clock timeout |
| `memory_bomb.py` — allocate 1 GB | MEMORY_LIMIT_EXCEEDED via OOM kill |
| `output_flood.py` — print loop | OUTPUT_LIMIT_EXCEEDED; container killed |

## Authentication Security

- Passwords hashed with **Argon2id** (PHC winner, OWASP recommended)
- JWT access tokens: 15-minute lifetime, HS256 signed
- Refresh tokens: 7-day lifetime, rotation on each use, reuse detection via Redis blacklist
- OAuth2 state parameter validated on callback to prevent CSRF
- Rate limiting on all auth endpoints (5 req/min per IP)

## Input Validation

- All API inputs validated with Bean Validation (`@Valid` on all request bodies)
- Markdown rendered server-side with sanitizing renderer (no `<script>`, no `javascript:` URIs)
- No raw SQL string concatenation — JPA/JPQL parameterized queries only
- File uploads validated: type, size, malware (Phase 8)
