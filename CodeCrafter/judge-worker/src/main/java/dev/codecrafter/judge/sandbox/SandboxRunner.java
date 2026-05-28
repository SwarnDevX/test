package dev.codecrafter.judge.sandbox;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

@Component
@Slf4j
public class SandboxRunner {

    @Value("${judge.seccomp-profile:/profiles/judge.json}")
    private String seccompProfile;

    @Value("${judge.sandbox.wall-clock-timeout-seconds:10}")
    private int wallClockTimeoutSeconds;

    @Value("${judge.sandbox.compile-timeout-seconds:30}")
    private int compileTimeoutSeconds;

    @Value("${judge.sandbox.output-size-limit-bytes:65536}")
    private int outputSizeLimitBytes;

    @Value("${judge.sandbox.memory-limit-mb:256}")
    private int memoryLimitMb;

    @Value("${judge.sandbox.cpu-limit:1.0}")
    private double cpuLimit;

    @Value("${judge.sandbox.pids-limit:64}")
    private int pidsLimit;

    @Value("${judge.sandbox.tmpfs-size-mb:64}")
    private int tmpfsSizeMb;

    public CompileResult compile(Language lang, Path workDir) throws IOException, InterruptedException {
        if (!lang.isCompiled()) return new CompileResult(true, "");

        List<String> cmd = buildDockerCmd(lang, workDir,
            lang.getCompileCommand() + " 2>&1", compileTimeoutSeconds, null);

        long start = System.currentTimeMillis();
        Process proc = new ProcessBuilder(cmd).redirectErrorStream(true).start();
        boolean finished = proc.waitFor(compileTimeoutSeconds, TimeUnit.SECONDS);
        if (!finished) {
            proc.destroyForcibly();
            return new CompileResult(false, "Compilation timed out");
        }
        String output = new String(proc.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        log.debug("Compile {} in {}ms exit={}", lang.getKey(),
            System.currentTimeMillis() - start, proc.exitValue());
        return new CompileResult(proc.exitValue() == 0, output);
    }

    public ExecResult execute(Language lang, Path workDir, String stdin, int timeLimitMs)
            throws IOException, InterruptedException {

        int timeoutSec = Math.max(1, (timeLimitMs / 1000) + 2);
        // Named container so we can sample docker stats; removed --rm for manual cleanup
        String containerName = "cc_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        List<String> cmd = buildDockerCmd(lang, workDir, lang.getRunCommand(), timeoutSec, containerName);

        long start = System.currentTimeMillis();
        Process proc = new ProcessBuilder(cmd).start();

        // Sample peak memory in a virtual thread while the container is alive
        AtomicLong peakMemKb = new AtomicLong(0);
        Thread sampler = Thread.ofVirtual().start(() -> samplePeakMemory(containerName, peakMemKb));

        try (var os = proc.getOutputStream()) {
            os.write(stdin.getBytes(StandardCharsets.UTF_8));
        }

        byte[] stdoutBytes = proc.getInputStream().readNBytes(outputSizeLimitBytes);
        byte[] stderrBytes = proc.getErrorStream().readNBytes(outputSizeLimitBytes);

        boolean finished = proc.waitFor(timeoutSec, TimeUnit.SECONDS);
        long runtimeMs = System.currentTimeMillis() - start;

        sampler.interrupt();
        removeContainer(containerName);

        if (!finished) {
            proc.destroyForcibly();
            return new ExecResult("", new String(stderrBytes, StandardCharsets.UTF_8),
                -1, true, false, runtimeMs, peakMemKb.get());
        }

        boolean outputLimitExceeded = stdoutBytes.length >= outputSizeLimitBytes;
        return new ExecResult(
            new String(stdoutBytes, StandardCharsets.UTF_8),
            new String(stderrBytes, StandardCharsets.UTF_8),
            proc.exitValue(),
            false,
            outputLimitExceeded,
            runtimeMs,
            peakMemKb.get()
        );
    }

    /**
     * Polls `docker stats` every 300ms while the container runs to capture peak memory.
     * Virtual-thread-safe: exits cleanly on interrupt.
     */
    private void samplePeakMemory(String containerName, AtomicLong peakMemKb) {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                Process stats = new ProcessBuilder(
                    "docker", "stats", "--no-stream", "--format", "{{.MemUsage}}", containerName
                ).redirectErrorStream(true).start();
                boolean done = stats.waitFor(2, TimeUnit.SECONDS);
                if (!done) stats.destroyForcibly();

                String line = new String(stats.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
                if (!line.isBlank() && line.contains("/")) {
                    long kb = parseDockerMemKb(line.split("/")[0].trim());
                    if (kb > 0) peakMemKb.updateAndGet(prev -> Math.max(prev, kb));
                }
                Thread.sleep(300);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } catch (Exception ignored) {}
        }
    }

    /** Parses Docker memory strings like "12.5MiB", "128MiB", "1.2GiB", "512KiB" → KB. */
    private long parseDockerMemKb(String mem) {
        try {
            String s = mem.toUpperCase().trim();
            if (s.endsWith("GIB")) return (long) (Double.parseDouble(s.replace("GIB", "").trim()) * 1_048_576);
            if (s.endsWith("MIB")) return (long) (Double.parseDouble(s.replace("MIB", "").trim()) * 1_024);
            if (s.endsWith("KIB")) return (long)  Double.parseDouble(s.replace("KIB", "").trim());
            if (s.endsWith("GB"))  return (long) (Double.parseDouble(s.replace("GB",  "").trim()) * 1_000_000);
            if (s.endsWith("MB"))  return (long) (Double.parseDouble(s.replace("MB",  "").trim()) * 1_000);
            if (s.endsWith("KB"))  return (long)  Double.parseDouble(s.replace("KB",  "").trim());
            if (s.endsWith("B"))   return Math.max(1L, Long.parseLong(s.replace("B", "").trim()) / 1024);
        } catch (Exception ignored) {}
        return 0;
    }

    private void removeContainer(String containerName) {
        try {
            new ProcessBuilder("docker", "rm", "-f", containerName)
                .redirectErrorStream(true).start().waitFor(5, TimeUnit.SECONDS);
        } catch (Exception ignored) {}
    }

    private List<String> buildDockerCmd(Language lang, Path workDir, String shellCmd,
                                        int timeoutSec, String containerName) {
        String mountPath = workDir.toAbsolutePath().toString().replace('\\', '/');
        if (mountPath.length() > 2 && mountPath.charAt(1) == ':') {
            mountPath = "/" + Character.toLowerCase(mountPath.charAt(0)) + mountPath.substring(2);
        }

        List<String> cmd = new ArrayList<>();
        cmd.add("docker");
        cmd.add("run");

        if (containerName != null) {
            // Named container for stats sampling; caller removes it manually
            cmd.add("--name");
            cmd.add(containerName);
        } else {
            cmd.add("--rm");
        }

        cmd.addAll(List.of(
            "--network=none",
            "--read-only",
            "--user", "65534:65534",
            "--memory=" + memoryLimitMb + "m",
            "--memory-swap=" + memoryLimitMb + "m",
            "--cpus=" + cpuLimit,
            "--pids-limit=" + pidsLimit,
            "--cap-drop=ALL",
            "--security-opt", "no-new-privileges",
            "-v", mountPath + ":/workspace:ro",
            "--tmpfs", "/tmp:exec,rw,size=" + tmpfsSizeMb + "m",
            "--stop-timeout", String.valueOf(timeoutSec)
        ));

        Path seccomp = Path.of(seccompProfile);
        if (Files.exists(seccomp)) {
            cmd.add("--security-opt");
            cmd.add("seccomp=" + seccompProfile);
        }

        cmd.addAll(List.of(lang.getDockerImage(), "/bin/sh", "-c", shellCmd));
        return cmd;
    }

    public void deleteWorkDir(Path dir) {
        if (dir == null) return;
        try {
            try (var walk = Files.walk(dir)) {
                walk.sorted(Comparator.reverseOrder())
                    .forEach(p -> { try { Files.delete(p); } catch (IOException ignored) {} });
            }
        } catch (IOException ignored) {}
    }

    public record CompileResult(boolean success, String output) {}

    public record ExecResult(
        String stdout,
        String stderr,
        int exitCode,
        boolean timedOut,
        boolean outputLimitExceeded,
        long runtimeMs,
        long memoryKb
    ) {}
}
