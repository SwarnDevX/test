package dev.codecrafter.judge.sandbox;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Integration tests that run actual Docker containers to verify the sandbox
 * neutralizes malicious code within its resource limits.
 *
 * Requires Docker to be installed and running on the host. Skipped otherwise.
 */
class SandboxSecurityTest {

    private static final SandboxRunner runner = new SandboxRunner();

    @TempDir
    Path tempDir;

    @BeforeAll
    static void requireDocker() {
        try {
            Process proc = new ProcessBuilder("docker", "info")
                .redirectErrorStream(true).start();
            proc.waitFor();
            assumeTrue(proc.exitValue() == 0, "Docker not available — skipping sandbox security tests");
        } catch (Exception e) {
            assumeTrue(false, "Docker not available — skipping sandbox security tests");
        }
    }

    // ── Fork bomb ─────────────────────────────────────────────────────────────

    @Test
    void forkBomb_isNeutralizedByPidsLimit() throws Exception {
        Path work = Files.createTempDirectory(tempDir, "forkbomb_");
        Files.writeString(work.resolve("solution.py"), """
            import os
            while True:
                os.fork()
            """);

        SandboxRunner.ExecResult result = runner.execute(Language.PYTHON, work, "", 5_000);

        // Must not run forever — timeout or killed by pids limit
        assertThat(result.timedOut() || result.exitCode() != 0)
            .as("Fork bomb must be killed (timeout or non-zero exit), never ACCEPTED")
            .isTrue();
    }

    // ── Network probe ─────────────────────────────────────────────────────────

    @Test
    void networkProbe_cannotOpenSocket() throws Exception {
        Path work = Files.createTempDirectory(tempDir, "netprobe_");
        Files.writeString(work.resolve("solution.py"), """
            import socket
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(2)
                s.connect(("8.8.8.8", 53))
                print("CONNECTED")
            except Exception as e:
                print("BLOCKED:", e)
            """);

        SandboxRunner.ExecResult result = runner.execute(Language.PYTHON, work, "", 5_000);

        // Network is --network=none so connect must fail
        assertThat(result.stdout())
            .as("Network connection must be blocked")
            .doesNotContain("CONNECTED");
    }

    // ── File write outside tmpfs ───────────────────────────────────────────────

    @Test
    void fileWrite_outsideTmpfs_isBlocked() throws Exception {
        Path work = Files.createTempDirectory(tempDir, "filewrite_");
        Files.writeString(work.resolve("solution.py"), """
            try:
                with open('/etc/passwd_hacked', 'w') as f:
                    f.write('pwned')
                print("WROTE")
            except Exception as e:
                print("BLOCKED:", e)
            """);

        SandboxRunner.ExecResult result = runner.execute(Language.PYTHON, work, "", 5_000);

        assertThat(result.stdout())
            .as("Write to /etc must be blocked by --read-only rootfs")
            .doesNotContain("WROTE");
        assertThat(result.stdout()).contains("BLOCKED");
    }

    // ── Write inside tmpfs is allowed ─────────────────────────────────────────

    @Test
    void fileWrite_insideTmpfs_isAllowed() throws Exception {
        Path work = Files.createTempDirectory(tempDir, "tmpfswrite_");
        Files.writeString(work.resolve("solution.py"), """
            with open('/tmp/scratch.txt', 'w') as f:
                f.write('hello')
            with open('/tmp/scratch.txt') as f:
                print(f.read())
            """);

        SandboxRunner.ExecResult result = runner.execute(Language.PYTHON, work, "", 5_000);

        assertThat(result.exitCode()).isZero();
        assertThat(result.stdout().strip()).isEqualTo("hello");
    }

    // ── Infinite loop → TLE ───────────────────────────────────────────────────

    @Test
    void infiniteLoop_isKilledByWallClockTimeout() throws Exception {
        Path work = Files.createTempDirectory(tempDir, "infloop_");
        Files.writeString(work.resolve("solution.py"), """
            while True:
                pass
            """);

        long start = System.currentTimeMillis();
        SandboxRunner.ExecResult result = runner.execute(Language.PYTHON, work, "", 2_000);
        long elapsed = System.currentTimeMillis() - start;

        assertThat(result.timedOut())
            .as("Infinite loop must be reported as timed out")
            .isTrue();
        // Wall clock timeout (2s run + 2s grace) → should complete in ≤ 10s
        assertThat(elapsed).isLessThan(15_000);
    }

    // ── Memory bomb ───────────────────────────────────────────────────────────

    @Test
    void memoryBomb_isKilledByMemoryLimit() throws Exception {
        Path work = Files.createTempDirectory(tempDir, "membomb_");
        // Allocate 1 GB — well above 256 MB limit
        Files.writeString(work.resolve("solution.py"), """
            x = bytearray(1024 * 1024 * 1024)  # 1 GB
            print(len(x))
            """);

        SandboxRunner.ExecResult result = runner.execute(Language.PYTHON, work, "", 10_000);

        assertThat(result.exitCode())
            .as("Memory bomb must be OOM-killed (non-zero exit)")
            .isNotZero();
        assertThat(result.stdout())
            .as("1 GB allocation must not succeed")
            .doesNotContain("1073741824");
    }

    // ── Output bomb → OLE ─────────────────────────────────────────────────────

    @Test
    void outputBomb_isTruncatedByOutputLimit() throws Exception {
        Path work = Files.createTempDirectory(tempDir, "outbomb_");
        // Tries to print far more than the 64 KB output limit
        Files.writeString(work.resolve("solution.py"), """
            for _ in range(1_000_000):
                print('A' * 100)
            """);

        SandboxRunner.ExecResult result = runner.execute(Language.PYTHON, work, "", 10_000);

        assertThat(result.outputLimitExceeded())
            .as("Output limit must be flagged when stdout exceeds 64 KB")
            .isTrue();
        // stdout captured is exactly the limit (64 KB)
        assertThat(result.stdout().length()).isLessThanOrEqualTo(65_536);
    }

    // ── Privilege escalation attempt ──────────────────────────────────────────

    @Test
    void privilegeEscalation_setuidBlocked() throws Exception {
        Path work = Files.createTempDirectory(tempDir, "privesc_");
        // Attempt setuid(0) — blocked by seccomp + --cap-drop=ALL + --user 65534
        Files.writeString(work.resolve("solution.py"), """
            import os
            try:
                os.setuid(0)
                print("ROOT")
            except PermissionError:
                print("BLOCKED")
            """);

        SandboxRunner.ExecResult result = runner.execute(Language.PYTHON, work, "", 5_000);

        assertThat(result.stdout())
            .as("setuid(0) must be blocked")
            .doesNotContain("ROOT");
        assertThat(result.stdout()).contains("BLOCKED");
    }

    // ── ptrace attempt ────────────────────────────────────────────────────────

    @Test
    void ptraceAttempt_isBlocked() throws Exception {
        Path work = Files.createTempDirectory(tempDir, "ptrace_");
        Files.writeString(work.resolve("solution.py"), """
            import ctypes, ctypes.util
            libc = ctypes.CDLL(ctypes.util.find_library("c"), use_errno=True)
            PTRACE_TRACEME = 0
            ret = libc.ptrace(PTRACE_TRACEME, 0, None, None)
            if ret == -1:
                print("BLOCKED")
            else:
                print("PTRACE_OK")
            """);

        SandboxRunner.ExecResult result = runner.execute(Language.PYTHON, work, "", 5_000);

        assertThat(result.stdout())
            .as("ptrace must be blocked by seccomp profile")
            .doesNotContain("PTRACE_OK");
    }

    // ── Compile error ─────────────────────────────────────────────────────────

    @Test
    void compileError_isReportedCorrectly() throws Exception {
        Path work = Files.createTempDirectory(tempDir, "compileerr_");
        Files.writeString(work.resolve("Main.java"), """
            public class Main {
                public static void main(String[] args) {
                    int x = "this is a type error";
                }
            }
            """);

        SandboxRunner.CompileResult compile = runner.compile(Language.JAVA, work);

        assertThat(compile.success()).isFalse();
        assertThat(compile.output()).contains("error:");
    }

    // ── Correct solution passes ───────────────────────────────────────────────

    @Test
    void correctPythonSolution_producesExpectedOutput() throws Exception {
        Path work = Files.createTempDirectory(tempDir, "correct_");
        Files.writeString(work.resolve("solution.py"), """
            n = int(input())
            print(n * 2)
            """);

        SandboxRunner.ExecResult result = runner.execute(Language.PYTHON, work, "21\n", 5_000);

        assertThat(result.exitCode()).isZero();
        assertThat(result.stdout().strip()).isEqualTo("42");
        assertThat(result.timedOut()).isFalse();
        assertThat(result.outputLimitExceeded()).isFalse();
    }

    // ── Memory is tracked ─────────────────────────────────────────────────────

    @Test
    void memoryUsage_isTracked() throws Exception {
        Path work = Files.createTempDirectory(tempDir, "mem_");
        Files.writeString(work.resolve("solution.py"), """
            x = [0] * 10_000_000  # ~80 MB
            print(len(x))
            """);

        SandboxRunner.ExecResult result = runner.execute(Language.PYTHON, work, "", 15_000);

        assertThat(result.exitCode()).isZero();
        // Memory sampler should detect > 0 KB usage
        assertThat(result.memoryKb())
            .as("Peak memory usage must be tracked and > 0")
            .isGreaterThan(0);
    }
}
