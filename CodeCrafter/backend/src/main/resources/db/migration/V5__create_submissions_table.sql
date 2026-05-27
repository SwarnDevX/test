-- Submissions: every code submission (run against full hidden test suite)
CREATE TABLE submissions (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT        NOT NULL REFERENCES users(id),
    problem_id              BIGINT        NOT NULL REFERENCES problems(id),
    language                VARCHAR(20)   NOT NULL,
    source_code             TEXT          NOT NULL,
    status                  VARCHAR(30)   NOT NULL DEFAULT 'QUEUED',
    verdict                 VARCHAR(30),
    runtime_ms              INTEGER,
    memory_kb               INTEGER,
    testcases_passed        INTEGER,
    total_testcases         INTEGER,
    failing_testcase_index  INTEGER,
    compile_error           TEXT,
    stdout                  TEXT,
    stderr                  TEXT,
    created_at              TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_user_id       ON submissions(user_id);
CREATE INDEX idx_submissions_problem_id    ON submissions(problem_id);
CREATE INDEX idx_submissions_user_problem  ON submissions(user_id, problem_id);
CREATE INDEX idx_submissions_status        ON submissions(status);
CREATE INDEX idx_submissions_created_at    ON submissions(created_at DESC);
