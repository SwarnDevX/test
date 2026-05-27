package dev.codecrafter.problem.sandbox;

import dev.codecrafter.problem.dto.RunResponse;
import dev.codecrafter.problem.dto.RunResponse.TestResult;
import dev.codecrafter.problem.entity.SampleTestCase;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;

@Service
@Slf4j
public class RunService {

    @Value("${app.sandbox.enable-seccomp:false}")
    private boolean enableSeccomp;

    @Value("${app.sandbox.seccomp-profile:/app/infra/seccomp/judge.json}")
    private String seccompProfile;

    private static final int RUN_TIMEOUT_SECONDS = 5;
    private static final int OUTPUT_LIMIT_BYTES   = 65536; // 64 KB

    /**
     * Runs source code against a list of sample test cases synchronously.
     * Each case gets its own container to isolate timeouts.
     */
    public RunResponse runAgainstSamples(String language, String sourceCode,
                                         List<SampleTestCase> samples) {
        Language lang;
        try {
            lang = Language.fromKey(language);
        } catch (IllegalArgumentException e) {
            return new RunResponse("INTERNAL_ERROR", List.of(), "Unsupported language: " + language);
        }

        Path workDir = null;
        try {
            workDir = Files.createTempDirectory("cc_run_");
            Path sourceFile = workDir.resolve(lang.getSourceFileName());
            Files.writeString(sourceFile, sourceCode);

            // Compile step (if needed)
            if (lang.isCompiled()) {
                CompileResult compile = compile(lang, workDir);
                if (!compile.success()) {
                    return new RunResponse("COMPILE_ERROR", List.of(), compile.output());
                }
            }

            // Run against each sample
            List<TestResult> results = new ArrayList<>();
            String overallVerdict = "ACCEPTED";

            for (int i = 0; i < samples.size(); i++) {
                SampleTestCase tc = samples.get(i);
                ExecResult exec = execute(lang, workDir, tc.getInput());

                String actual = exec.stdout().strip();
                String expected = tc.getExpectedOutput().strip();
                String verdict = determineVerdict(exec, actual, expected);

                results.add(new TestResult(
                    i,
                    tc.getInput(),
                    expected,
                    actual,
                    exec.stderr(),
                    exec.runtimeMs(),
                    verdict
                ));

                if (!"ACCEPTED".equals(verdict) && "ACCEPTED".equals(overallVerdict)) {
                    overallVerdict = verdict;
                }
            }

            return new RunResponse(overallVerdict, results, null);

        } catch (Exception e) {
            log.error("Run service error", e);
            return new RunResponse("INTERNAL_ERROR", List.of(), e.getMessage());
        } finally {
            deleteQuietly(workDir);
        }
    }

    /**
     * Runs source code against custom (user-provided) stdin.
     * No expected-output comparison — just returns raw stdout/stderr.
     */
    public RunResponse runCustomInput(String language, String sourceCode, String customInput) {
        Language lang;
        try {
            lang = Language.fromKey(language);
        } catch (IllegalArgumentException e) {
            return new RunResponse("INTERNAL_ERROR", List.of(), "Unsupported language: " + language);
        }

        Path workDir = null;
        try {
            workDir = Files.createTempDirectory("cc_run_");
            Path sourceFile = workDir.resolve(lang.getSourceFileName());
            Files.writeString(sourceFile, sourceCode);

            if (lang.isCompiled()) {
                CompileResult compile = compile(lang, workDir);
                if (!compile.success()) {
                    return new RunResponse("COMPILE_ERROR", List.of(), compile.output());
                }
            }

            ExecResult exec = execute(lang, workDir, customInput != null ? customInput : "");
            String verdict = exec.timedOut() ? "TIME_LIMIT_EXCEEDED"
                           : exec.exitCode() != 0 ? "RUNTIME_ERROR"
                           : "ACCEPTED";

            TestResult result = new TestResult(0, customInput, null,
                exec.stdout(), exec.stderr(), exec.runtimeMs(), verdict);

            return new RunResponse(verdict, List.of(result), null);

        } catch (Exception e) {
            log.error("Custom run error", e);
            return new RunResponse("INTERNAL_ERROR", List.of(), e.getMessage());
        } finally {
            deleteQuietly(workDir);
        }
    }

    // ── private helpers ──────────────────────────────────────────────────────

    private CompileResult compile(Language lang, Path workDir) throws IOException, InterruptedException {
        List<String> cmd = buildDockerCmd(lang, workDir,
            lang.getCompileCommand() + " 2>&1");

        long start = System.currentTimeMillis();
        Process proc = new ProcessBuilder(cmd)
            .redirectErrorStream(true)
            .start();

        boolean finished = proc.waitFor(30, TimeUnit.SECONDS);
        if (!finished) {
            proc.destroyForcibly();
            return new CompileResult(false, "Compilation timed out");
        }
        String output = new String(proc.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        log.debug("Compile ({}) in {}ms, exit={}", lang.getKey(),
            System.currentTimeMillis() - start, proc.exitValue());
        return new CompileResult(proc.exitValue() == 0, output);
    }

    private ExecResult execute(Language lang, Path workDir, String stdin)
            throws IOException, InterruptedException {

        String shellCmd = lang.isCompiled()
            ? lang.getRunCommand()
            : lang.getRunCommand();

        List<String> cmd = buildDockerCmd(lang, workDir, shellCmd);

        long start = System.currentTimeMillis();
        Process proc = new ProcessBuilder(cmd).start();

        // Feed stdin
        try (var os = proc.getOutputStream()) {
            os.write(stdin.getBytes(StandardCharsets.UTF_8));
        }

        // Read stdout + stderr with output size cap
        byte[] stdoutBytes = proc.getInputStream().readNBytes(OUTPUT_LIMIT_BYTES);
        byte[] stderrBytes = proc.getErrorStream().readNBytes(OUTPUT_LIMIT_BYTES);

        boolean finished = proc.waitFor(RUN_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        long runtimeMs = System.currentTimeMillis() - start;

        if (!finished) {
            proc.destroyForcibly();
            return new ExecResult("", new String(stderrBytes, StandardCharsets.UTF_8),
                -1, true, runtimeMs);
        }

        return new ExecResult(
            new String(stdoutBytes, StandardCharsets.UTF_8),
            new String(stderrBytes, StandardCharsets.UTF_8),
            proc.exitValue(),
            false,
            runtimeMs
        );
    }

    private List<String> buildDockerCmd(Language lang, Path workDir, String shellCmd) {
        // Normalize path for Docker on Windows (Docker Desktop handles /c/... style)
        String mountPath = workDir.toAbsolutePath().toString().replace('\\', '/');
        // Windows: C:\foo → /c/foo
        if (mountPath.length() > 2 && mountPath.charAt(1) == ':') {
            mountPath = "/" + Character.toLowerCase(mountPath.charAt(0)) + mountPath.substring(2);
        }

        List<String> cmd = new ArrayList<>(List.of(
            "docker", "run", "--rm",
            "--network=none",
            "--memory=256m", "--memory-swap=256m",
            "--cpus=1.0",
            "--pids-limit=64",
            "--cap-drop=ALL",
            "--security-opt", "no-new-privileges",
            "-v", mountPath + ":/workspace:ro",
            "--tmpfs", "/tmp:exec,rw,size=128m"
        ));

        if (enableSeccomp && Files.exists(Path.of(seccompProfile))) {
            cmd.add("--security-opt");
            cmd.add("seccomp=" + seccompProfile);
        }

        cmd.addAll(List.of(
            lang.getDockerImage(),
            "/bin/sh", "-c", shellCmd
        ));

        return cmd;
    }

    private String determineVerdict(ExecResult exec, String actual, String expected) {
        if (exec.timedOut()) return "TIME_LIMIT_EXCEEDED";
        if (exec.exitCode() != 0) return "RUNTIME_ERROR";
        return actual.equals(expected) ? "ACCEPTED" : "WRONG_ANSWER";
    }

    private void deleteQuietly(Path dir) {
        if (dir == null) return;
        try {
            try (var walk = Files.walk(dir)) {
                walk.sorted(Comparator.reverseOrder())
                    .forEach(p -> { try { Files.delete(p); } catch (IOException ignored) {} });
            }
        } catch (IOException ignored) {}
    }

    private record CompileResult(boolean success, String output) {}

    private record ExecResult(
        String stdout,
        String stderr,
        int exitCode,
        boolean timedOut,
        long runtimeMs
    ) {}
}
