-- ─── User profiles ───────────────────────────────────────────────────────────
CREATE TABLE user_profiles (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id              BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name         VARCHAR(100),
    avatar_url           VARCHAR(512),
    bio                  TEXT,
    location             VARCHAR(100),
    company              VARCHAR(100),
    school               VARCHAR(100),
    github_url           VARCHAR(255),
    linkedin_url         VARCHAR(255),
    twitter_url          VARCHAR(255),
    preferred_languages  VARCHAR(500),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_profiles_user UNIQUE (user_id)
);

-- ─── User stats (denormalized counters — updated by judge worker) ─────────────
CREATE TABLE user_stats (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    easy_solved      INT NOT NULL DEFAULT 0,
    medium_solved    INT NOT NULL DEFAULT 0,
    hard_solved      INT NOT NULL DEFAULT 0,
    total_solved     INT NOT NULL DEFAULT 0,
    current_streak   INT NOT NULL DEFAULT 0,
    longest_streak   INT NOT NULL DEFAULT 0,
    ranking          INT,
    reputation       INT NOT NULL DEFAULT 0,
    last_active_date DATE,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_stats_user UNIQUE (user_id)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX idx_user_stats_user    ON user_stats(user_id);
CREATE INDEX idx_user_stats_ranking ON user_stats(ranking);
