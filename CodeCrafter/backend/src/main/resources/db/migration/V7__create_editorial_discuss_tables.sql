-- ── Editorials (admin-authored, one per problem) ─────────────────────────────
CREATE TABLE editorials (
    id               BIGSERIAL PRIMARY KEY,
    problem_id       BIGINT    NOT NULL UNIQUE REFERENCES problems(id),
    author_id        BIGINT    REFERENCES users(id),
    content_markdown TEXT      NOT NULL DEFAULT '',
    is_published     BOOLEAN   NOT NULL DEFAULT false,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Community Solutions ────────────────────────────────────────────────────────
CREATE TABLE solutions (
    id               BIGSERIAL    PRIMARY KEY,
    problem_id       BIGINT       NOT NULL REFERENCES problems(id),
    user_id          BIGINT       NOT NULL REFERENCES users(id),
    title            VARCHAR(200) NOT NULL,
    content_markdown TEXT         NOT NULL,
    language         VARCHAR(20),
    vote_score       INTEGER      NOT NULL DEFAULT 0,
    comment_count    INTEGER      NOT NULL DEFAULT 0,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_solutions_problem    ON solutions(problem_id);
CREATE INDEX idx_solutions_user       ON solutions(user_id);
CREATE INDEX idx_solutions_votes_date ON solutions(vote_score DESC, created_at DESC);

CREATE TABLE solution_votes (
    id          BIGSERIAL PRIMARY KEY,
    solution_id BIGINT    NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
    user_id     BIGINT    NOT NULL REFERENCES users(id),
    value       SMALLINT  NOT NULL CHECK (value IN (-1, 1)),
    UNIQUE(solution_id, user_id)
);

CREATE TABLE solution_comments (
    id               BIGSERIAL PRIMARY KEY,
    solution_id      BIGINT    NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
    user_id          BIGINT    NOT NULL REFERENCES users(id),
    parent_id        BIGINT    REFERENCES solution_comments(id),
    content_markdown TEXT      NOT NULL,
    vote_score       INTEGER   NOT NULL DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sol_comments_solution ON solution_comments(solution_id);

-- ── Discussions (global + per-problem) ────────────────────────────────────────
CREATE TABLE discussions (
    id               BIGSERIAL    PRIMARY KEY,
    problem_id       BIGINT       REFERENCES problems(id),
    user_id          BIGINT       NOT NULL REFERENCES users(id),
    title            VARCHAR(300) NOT NULL,
    content_markdown TEXT         NOT NULL,
    category         VARCHAR(30)  NOT NULL DEFAULT 'GENERAL',
    vote_score       INTEGER      NOT NULL DEFAULT 0,
    reply_count      INTEGER      NOT NULL DEFAULT 0,
    is_answered      BOOLEAN      NOT NULL DEFAULT false,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discussions_problem  ON discussions(problem_id);
CREATE INDEX idx_discussions_category ON discussions(category);
CREATE INDEX idx_discussions_created  ON discussions(created_at DESC);

CREATE TABLE discussion_replies (
    id               BIGSERIAL PRIMARY KEY,
    discussion_id    BIGINT    NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    user_id          BIGINT    NOT NULL REFERENCES users(id),
    parent_id        BIGINT    REFERENCES discussion_replies(id),
    content_markdown TEXT      NOT NULL,
    vote_score       INTEGER   NOT NULL DEFAULT 0,
    is_answer        BOOLEAN   NOT NULL DEFAULT false,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_disc_replies_discussion ON discussion_replies(discussion_id);

CREATE TABLE discussion_votes (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT    NOT NULL REFERENCES users(id),
    discussion_id BIGINT    REFERENCES discussions(id)        ON DELETE CASCADE,
    reply_id      BIGINT    REFERENCES discussion_replies(id) ON DELETE CASCADE,
    value         SMALLINT  NOT NULL CHECK (value IN (-1, 1)),
    UNIQUE NULLS NOT DISTINCT (user_id, discussion_id),
    UNIQUE NULLS NOT DISTINCT (user_id, reply_id)
);
