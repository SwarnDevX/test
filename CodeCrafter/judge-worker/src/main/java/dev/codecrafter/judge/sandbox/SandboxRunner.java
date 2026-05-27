package dev.codecrafter.judge.sandbox;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

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
            lang.getCompileCommand() + " 2>&1", compileTimeoutSeconds);

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
        List<String> cmd = buildDockerCmd(lang, workDir, lang.getRunCommand(), timeoutSec);

        long start = System.currentTimeMillis();
        Process proc = new ProcessBuilder(cmd).start();

        try (var os = proc.getOutputStream()) {
            os.write(stdin.getBytes(StandardCharsets.UTF_8));
        }

        byte[] stdoutBytes = proc.getInputStream().readNBytes(outputSizeLimitBytes);
        byte[] stderrBytes = proc.getErrorStream().readNBytes(outputSizeLimitBytes);

        boolean finished = proc.waitFor(timeoutSec, TimeUnit.SECONDS);
        long runtimeMs = System.currentTimeMillis() - start;

        if (!finished) {
            proc.destroyForcibly();
            return new ExecResult("", new String(stderrBytes, StandardCharsets.UTF_8),
                -1, true, false, runtimeMs);
        }

        boolean outputLimitExceeded = stdoutBytes.length >= outputSizeLimitBytes;
        return new ExecResult(
            new String(stdoutBytes, StandardCharsets.UTF_8),
            new String(stderrBytes, StandardCharsets.UTF_8),
            proc.exitValue(),
            false,
            outputLimitExceeded,
            runtimeMs
        );
    }

    private List<String> buildDockerCmd(Language lang, Path workDir, String shellCmd, int timeoutSec) {
        String mountPath = workDir.toAbsolutePath().toString().replace('\\', '/');
        if (mountPath.length() > 2 && mountPath.charAt(1) == ':') {
            mountPath = "/" + Character.toLowerCase(mountPath.charAt(0)) + mountPath.substring(2);
        }

        List<String> cmd = new ArrayList<>(List.of(
            "docker", "run", "--rm",
            "--network=none",
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
        long runtimeMs
    ) {}
}
