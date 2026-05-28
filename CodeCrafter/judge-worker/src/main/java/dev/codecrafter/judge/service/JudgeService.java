package dev.codecrafter.judge.service;

import dev.codecrafter.judge.entity.Submission;
import dev.codecrafter.judge.entity.TestCase;
import dev.codecrafter.judge.messaging.JudgeJobMessage;
import dev.codecrafter.judge.messaging.TestCaseResultMessage;
import dev.codecrafter.judge.messaging.VerdictMessage;
import dev.codecrafter.judge.repository.SubmissionRepository;
import dev.codecrafter.judge.repository.TestCaseRepository;
import dev.codecrafter.judge.sandbox.Language;
import dev.codecrafter.judge.sandbox.SandboxRunner;
import dev.codecrafter.judge.sandbox.SandboxRunner.CompileResult;
import dev.codecrafter.judge.sandbox.SandboxRunner.ExecResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class JudgeService {

    private final SandboxRunner sandbox;
    private final SubmissionRepository submissionRepository;
    private final TestCaseRepository testCaseRepository;

    @Transactional
    public VerdictMessage judge(JudgeJobMessage job) {
        log.info("Judging submission {} (problem={}, lang={})",
            job.submissionId(), job.problemId(), job.language());

        markRunning(job.submissionId());

        Language lang;
        try {
            lang = Language.fromKey(job.language());
        } catch (IllegalArgumentException e) {
            return buildError(job, "INTERNAL_ERROR", null, "Unsupported language: " + job.language());
        }

        List<TestCase> testCases = testCaseRepository.findByProblemIdOrderByOrderIndexAsc(job.problemId());
        if (testCases.isEmpty()) {
            return buildError(job, "INTERNAL_ERROR", null, "No test cases found for problem " + job.problemId());
        }

        Path workDir = null;
        try {
            workDir = Files.createTempDirectory("cc_judge_");
            Path sourceFile = workDir.resolve(lang.getSourceFileName());
            Files.writeString(sourceFile, job.sourceCode());

            // Compile
            CompileResult compile = sandbox.compile(lang, workDir);
            if (!compile.success()) {
                return buildError(job, "COMPILE_ERROR", compile.output(), null);
            }

            // Run each test case
            List<TestCaseResultMessage> results = new ArrayList<>();
            String overallVerdict = "ACCEPTED";
            Integer failingIndex = null;
            long maxRuntimeMs = 0;
            long maxMemoryKb = 0;

            for (int i = 0; i < testCases.size(); i++) {
                TestCase tc = testCases.get(i);
                ExecResult exec = sandbox.execute(lang, workDir, tc.getInput(), job.timeLimitMs());

                String actual = exec.stdout().strip();
                String expected = tc.getExpectedOutput().strip();
                String verdict = caseVerdict(exec, actual, expected);

                maxRuntimeMs = Math.max(maxRuntimeMs, exec.runtimeMs());
                maxMemoryKb  = Math.max(maxMemoryKb,  exec.memoryKb());

                results.add(new TestCaseResultMessage(
                    i, verdict, actual, expected, exec.stderr(), exec.runtimeMs()
                ));

                if (!"ACCEPTED".equals(verdict) && "ACCEPTED".equals(overallVerdict)) {
                    overallVerdict = verdict;
                    failingIndex = i;
                }

                // Stop early on non-AC to avoid wasting time
                if (!"ACCEPTED".equals(overallVerdict)) break;
            }

            int passed = (int) results.stream().filter(r -> "ACCEPTED".equals(r.verdict())).count();

            VerdictMessage verdict = new VerdictMessage(
                job.submissionId(), job.userId(),
                overallVerdict,
                passed, testCases.size(),
                failingIndex,
                (int) maxRuntimeMs,
                maxMemoryKb > 0 ? (int) maxMemoryKb : null,
                null,
                results
            );

            persistVerdict(verdict);
            return verdict;

        } catch (Exception e) {
            log.error("Judge error for submission {}", job.submissionId(), e);
            return buildError(job, "INTERNAL_ERROR", null, e.getMessage());
        } finally {
            if (workDir != null) sandbox.deleteWorkDir(workDir);
        }
    }

    private void markRunning(Long submissionId) {
        submissionRepository.findById(submissionId).ifPresent(s -> {
            s.setStatus("RUNNING");
            submissionRepository.save(s);
        });
    }

    @Transactional
    void persistVerdict(VerdictMessage v) {
        submissionRepository.findById(v.submissionId()).ifPresent(s -> {
            s.setStatus(v.verdict());
            s.setVerdict(v.verdict());
            s.setTestcasesPassed(v.testcasesPassed());
            s.setTotalTestcases(v.totalTestcases());
            s.setFailingTestcaseIndex(v.failingTestcaseIndex());
            s.setRuntimeMs(v.runtimeMs());
            s.setMemoryKb(v.memoryKb());
            s.setCompileError(v.compileError());
            if (!v.results().isEmpty()) {
                TestCaseResultMessage first = v.results().get(0);
                s.setStdout(first.actualOutput());
                s.setStderr(first.stderr());
            }
            submissionRepository.save(s);
        });
    }

    private VerdictMessage buildError(JudgeJobMessage job, String verdict,
                                      String compileError, String internalMsg) {
        if (internalMsg != null) log.warn("Submission {} → {}: {}", job.submissionId(), verdict, internalMsg);

        VerdictMessage msg = new VerdictMessage(
            job.submissionId(), job.userId(),
            verdict, 0, 0, null, null, null,
            compileError != null ? compileError : internalMsg,
            List.of()
        );
        persistVerdict(msg);
        return msg;
    }

    private String caseVerdict(ExecResult exec, String actual, String expected) {
        if (exec.outputLimitExceeded()) return "OUTPUT_LIMIT_EXCEEDED";
        if (exec.timedOut()) return "TIME_LIMIT_EXCEEDED";
        if (exec.exitCode() != 0) return "RUNTIME_ERROR";
        return actual.equals(expected) ? "ACCEPTED" : "WRONG_ANSWER";
    }
}
