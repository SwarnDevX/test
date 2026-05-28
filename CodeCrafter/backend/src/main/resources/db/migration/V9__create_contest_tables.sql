-- ── Contests ──────────────────────────────────────────────────────────────────
CREATE TABLE contests (
    id          BIGSERIAL    PRIMARY KEY,
    slug        VARCHAR(80)  NOT NULL UNIQUE,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    type        VARCHAR(20)  NOT NULL DEFAULT 'SPECIAL',
    start_time  TIMESTAMP    NOT NULL,
    end_time    TIMESTAMP    NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'UPCOMING',
    is_visible  BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contests_start  ON contests(start_time DESC);
CREATE INDEX idx_contests_status ON contests(status);

-- ── Problems per contest ───────────────────────────────────────────────────────
CREATE TABLE contest_problems (
    id          BIGSERIAL   PRIMARY KEY,
    contest_id  BIGINT      NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    problem_id  BIGINT      NOT NULL REFERENCES problems(id),
    alias       VARCHAR(5)  NOT NULL DEFAULT 'A',
    order_index INTEGER     NOT NULL DEFAULT 0,
    points      INTEGER     NOT NULL DEFAULT 100,
    UNIQUE(contest_id, problem_id),
    UNIQUE(contest_id, alias)
);

CREATE INDEX idx_cp_contest ON contest_problems(contest_id, order_index);

-- ── Participants ───────────────────────────────────────────────────────────────
CREATE TABLE contest_participants (
    id             BIGSERIAL PRIMARY KEY,
    contest_id     BIGINT    NOT NULL REFERENCES contests(id),
    user_id        BIGINT    NOT NULL REFERENCES users(id),
    registered_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    solved_count   INTEGER   NOT NULL DEFAULT 0,
    penalty_secs   INTEGER   NOT NULL DEFAULT 0,
    final_rank     INTEGER,
    rating_change  INTEGER,
    UNIQUE(contest_id, user_id)
);

CREATE INDEX idx_contest_part_contest ON contest_participants(contest_id, final_rank);
CREATE INDEX idx_contest_part_user    ON contest_participants(user_id);

-- ── Contest submissions (one row per submission made during a contest) ─────────
CREATE TABLE contest_submissions (
    id              BIGSERIAL PRIMARY KEY,
    contest_id      BIGINT    NOT NULL REFERENCES contests(id),
    submission_id   BIGINT    NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    problem_id      BIGINT    NOT NULL REFERENCES problems(id),
    user_id         BIGINT    NOT NULL REFERENCES users(id),
    is_accepted     BOOLEAN   NOT NULL DEFAULT false,
    solved_at       TIMESTAMP,
    UNIQUE(contest_id, submission_id)
);

CREATE INDEX idx_cs_contest_user    ON contest_submissions(contest_id, user_id);
CREATE INDEX idx_cs_contest_problem ON contest_submissions(contest_id, problem_id, user_id);

-- ── Rating history ─────────────────────────────────────────────────────────────
CREATE TABLE contest_ratings (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT    NOT NULL REFERENCES users(id),
    contest_id        BIGINT    NOT NULL REFERENCES contests(id),
    old_rating        INTEGER   NOT NULL DEFAULT 1500,
    new_rating        INTEGER   NOT NULL DEFAULT 1500,
    rank              INTEGER   NOT NULL,
    participant_count INTEGER   NOT NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, contest_id)
);

CREATE INDEX idx_cr_user ON contest_ratings(user_id, created_at DESC);

-- ── Extend user_stats with contest columns ─────────────────────────────────────
ALTER TABLE user_stats
    ADD COLUMN IF NOT EXISTS contest_rating       INTEGER NOT NULL DEFAULT 1500,
    ADD COLUMN IF NOT EXISTS contests_participated INTEGER NOT NULL DEFAULT 0;
