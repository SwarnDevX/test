-- ── Study Plans ───────────────────────────────────────────────────────────────
CREATE TABLE study_plans (
    id             BIGSERIAL    PRIMARY KEY,
    slug           VARCHAR(80)  NOT NULL UNIQUE,
    title          VARCHAR(200) NOT NULL,
    description    TEXT,
    icon           VARCHAR(10),
    difficulty     VARCHAR(20)  NOT NULL DEFAULT 'MIXED',
    problem_count  INTEGER      NOT NULL DEFAULT 0,
    estimated_days INTEGER,
    is_published   BOOLEAN      NOT NULL DEFAULT false,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE study_plan_problems (
    id           BIGSERIAL PRIMARY KEY,
    plan_id      BIGINT    NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    problem_id   BIGINT    NOT NULL REFERENCES problems(id),
    order_index  INTEGER   NOT NULL DEFAULT 0,
    notes        TEXT,
    UNIQUE(plan_id, problem_id)
);

CREATE INDEX idx_spp_plan_order ON study_plan_problems(plan_id, order_index);

CREATE TABLE user_study_plan_progress (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT    NOT NULL REFERENCES users(id),
    plan_id      BIGINT    NOT NULL REFERENCES study_plans(id),
    problem_id   BIGINT    NOT NULL REFERENCES problems(id),
    completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, plan_id, problem_id)
);

CREATE INDEX idx_uspp_user_plan ON user_study_plan_progress(user_id, plan_id);

-- ── Daily Challenges ──────────────────────────────────────────────────────────
CREATE TABLE daily_challenges (
    id             BIGSERIAL PRIMARY KEY,
    problem_id     BIGINT    NOT NULL REFERENCES problems(id),
    challenge_date DATE      NOT NULL UNIQUE,
    bonus_points   INTEGER   NOT NULL DEFAULT 10,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_daily_challenges_date ON daily_challenges(challenge_date DESC);

-- ── Seed published study plans (problems added via admin API) ─────────────────
INSERT INTO study_plans (slug, title, description, icon, difficulty, estimated_days, is_published) VALUES
('blind-75',            'Blind 75',                    'The original 75 must-know problems for FAANG interviews, curated by the community.',                 '🎯', 'MIXED',  75, true),
('top-interview-150',   'Top Interview 150',           'Prepare for technical interviews with 150 essential problems used by top companies.',                 '🏆', 'MIXED',  90, true),
('sliding-window',      'Sliding Window Pattern',      'Master the sliding window technique for subarray and substring problems.',                            '🪟', 'MEDIUM',  7, true),
('two-pointers',        'Two Pointers Pattern',        'Learn the two-pointer technique for efficient array and string traversal.',                           '👉', 'EASY',    5, true),
('dynamic-programming', 'Dynamic Programming Patterns','Comprehensive DP guide: memoization, tabulation, and all common patterns.',                          '💡', 'HARD',   30, true),
('graph-bfs-dfs',       'Graph BFS / DFS',             'Master breadth-first and depth-first search on trees and graphs.',                                   '🕸️', 'MEDIUM', 14, true),
('sql-50',              'SQL 50',                      'The 50 most important SQL problems for database interviews.',                                         '🗄️', 'MIXED',  30, true);

-- ── Add study plan completion badges ──────────────────────────────────────────
INSERT INTO badges (slug, name, description, icon) VALUES
('plan-blind-75',            'Blind 75 Complete',              'Completed all 75 problems in the Blind 75 plan',                '🎯'),
('plan-top-interview-150',   'Top Interview 150 Complete',     'Completed all 150 problems in Top Interview 150',               '🏆'),
('plan-sliding-window',      'Sliding Window Master',          'Completed the Sliding Window Pattern study plan',               '🪟'),
('plan-two-pointers',        'Two Pointers Master',            'Completed the Two Pointers Pattern study plan',                 '👉'),
('plan-dynamic-programming', 'DP Master',                      'Completed the Dynamic Programming Patterns study plan',         '💡'),
('plan-graph-bfs-dfs',       'Graph Master',                   'Completed the Graph BFS/DFS study plan',                       '🕸️'),
('plan-sql-50',              'SQL 50 Complete',                'Completed all 50 SQL problems',                                 '🗄️');
