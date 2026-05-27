-- ─── Tags ───────────────────────────────────────────────────────────────────
CREATE TABLE tags (
    id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug    VARCHAR(100) NOT NULL UNIQUE,
    name    VARCHAR(100) NOT NULL
);

-- ─── Companies ──────────────────────────────────────────────────────────────
CREATE TABLE companies (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL
);

-- ─── Problems ───────────────────────────────────────────────────────────────
CREATE TABLE problems (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug                 VARCHAR(200) NOT NULL UNIQUE,
    number               INT          NOT NULL UNIQUE,
    title                VARCHAR(300) NOT NULL,
    difficulty           VARCHAR(10)  NOT NULL CHECK (difficulty IN ('EASY','MEDIUM','HARD')),
    -- stored generated column so we can ORDER BY difficulty naturally
    difficulty_order     INT GENERATED ALWAYS AS (
                             CASE difficulty WHEN 'EASY' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END
                         ) STORED,
    body_markdown        TEXT         NOT NULL,
    constraints_markdown TEXT,
    follow_up_markdown   TEXT,
    acceptance_rate      DECIMAL(5,2) NOT NULL DEFAULT 0,
    submission_count     INT          NOT NULL DEFAULT 0,
    like_count           INT          NOT NULL DEFAULT 0,
    dislike_count        INT          NOT NULL DEFAULT 0,
    time_limit_ms        INT          NOT NULL DEFAULT 2000,
    memory_limit_mb      INT          NOT NULL DEFAULT 256,
    is_premium           BOOLEAN      NOT NULL DEFAULT false,
    active               BOOLEAN      NOT NULL DEFAULT true,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_problems_difficulty  ON problems(difficulty);
CREATE INDEX idx_problems_active      ON problems(active);
CREATE INDEX idx_problems_number      ON problems(number);
CREATE INDEX idx_problems_acceptance  ON problems(acceptance_rate);

-- ─── Problem ↔ Tags (M2M) ───────────────────────────────────────────────────
CREATE TABLE problem_tags (
    problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    tag_id     BIGINT NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
    PRIMARY KEY (problem_id, tag_id)
);
CREATE INDEX idx_problem_tags_tag ON problem_tags(tag_id);

-- ─── Problem ↔ Companies (M2M) ──────────────────────────────────────────────
CREATE TABLE problem_companies (
    problem_id BIGINT NOT NULL REFERENCES problems(id)  ON DELETE CASCADE,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    frequency  INT    NOT NULL DEFAULT 1,
    PRIMARY KEY (problem_id, company_id)
);

-- ─── Examples (visible in description) ──────────────────────────────────────
CREATE TABLE problem_examples (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    problem_id  BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input       TEXT   NOT NULL,
    output      TEXT   NOT NULL,
    explanation TEXT,
    sort_order  INT    NOT NULL DEFAULT 0
);
CREATE INDEX idx_problem_examples_problem ON problem_examples(problem_id);

-- ─── Sample test cases (used for Run, shown in console) ─────────────────────
CREATE TABLE sample_test_cases (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    problem_id      BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input           TEXT   NOT NULL,
    expected_output TEXT   NOT NULL,
    sort_order      INT    NOT NULL DEFAULT 0
);
CREATE INDEX idx_sample_test_cases_problem ON sample_test_cases(problem_id);

-- ─── Hidden test cases (used for Submit, Phase 3) ───────────────────────────
CREATE TABLE test_cases (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    problem_id      BIGINT  NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input           TEXT    NOT NULL,
    expected_output TEXT    NOT NULL,
    sort_order      INT     NOT NULL DEFAULT 0,
    is_sample       BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_test_cases_problem ON test_cases(problem_id);

-- ─── Per-language starter code ───────────────────────────────────────────────
CREATE TABLE problem_languages (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    problem_id   BIGINT       NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    language     VARCHAR(20)  NOT NULL,
    starter_code TEXT         NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (problem_id, language)
);
CREATE INDEX idx_problem_languages_problem ON problem_languages(problem_id);
