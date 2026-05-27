-- Daily activity (one row per user per calendar date, ac_count = accepted submissions that day)
CREATE TABLE user_activity (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT  NOT NULL REFERENCES users(id),
    activity_date DATE    NOT NULL,
    ac_count      INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, activity_date)
);

CREATE INDEX idx_user_activity_user_date ON user_activity(user_id, activity_date DESC);

-- Badge catalogue
CREATE TABLE badges (
    id          BIGSERIAL PRIMARY KEY,
    slug        VARCHAR(60)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description TEXT         NOT NULL,
    icon        VARCHAR(10)
);

-- User → Badge join (awarded once, idempotent)
CREATE TABLE user_badges (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT    NOT NULL REFERENCES users(id),
    badge_id    BIGINT    NOT NULL REFERENCES badges(id),
    awarded_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- Seed badge catalogue
INSERT INTO badges (slug, name, description, icon) VALUES
('first-submission',  'First Submission',    'Submitted your first solution',                      '🚀'),
('first-ac',          'First AC',            'Got your first Accepted solution',                   '✅'),
('10-solved',         '10 Solved',           'Solved 10 problems',                                 '🔟'),
('50-solved',         '50 Solved',           'Solved 50 problems',                                 '⭐'),
('100-solved',        '100 Solved',          'Solved 100 problems',                                '💯'),
('7-day-streak',      '7-Day Streak',        'Solved problems 7 consecutive days',                 '🔥'),
('30-day-streak',     '30-Day Streak',       'Solved problems 30 consecutive days',                '🔥'),
('first-hard',        'Hard Conqueror',      'Solved your first Hard difficulty problem',          '💪'),
('polyglot',          'Polyglot',            'Got AC in 3 or more different languages',            '🌍'),
('night-owl',         'Night Owl',           'Submitted code between midnight and 5 AM',           '🦉'),
('speed-demon',       'Speed Demon',         'Got AC within 5 minutes of first keypress',          '⚡');
