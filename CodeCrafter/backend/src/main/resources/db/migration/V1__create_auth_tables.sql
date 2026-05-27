-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id                              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email                           VARCHAR(255) NOT NULL,
    username                        VARCHAR(50),
    password_hash                   VARCHAR(255),
    email_verified                  BOOLEAN NOT NULL DEFAULT FALSE,
    email_verification_token        VARCHAR(255),
    email_verification_expires_at   TIMESTAMPTZ,
    active                          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_email    UNIQUE (email),
    CONSTRAINT uq_users_username UNIQUE (username)
);

-- ─── Roles ───────────────────────────────────────────────────────────────────
CREATE TABLE roles (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    CONSTRAINT uq_roles_name UNIQUE (name)
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ─── Refresh tokens ──────────────────────────────────────────────────────────
CREATE TABLE refresh_tokens (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash       VARCHAR(64) NOT NULL,
    expires_at       TIMESTAMPTZ NOT NULL,
    revoked          BOOLEAN NOT NULL DEFAULT FALSE,
    replaced_by_hash VARCHAR(64),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_refresh_tokens_hash UNIQUE (token_hash)
);

-- ─── OAuth2 accounts ─────────────────────────────────────────────────────────
CREATE TABLE oauth_accounts (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider            VARCHAR(50) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    access_token        TEXT,
    token_expires_at    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_oauth_provider_account UNIQUE (provider, provider_account_id)
);

-- ─── Password reset tokens ───────────────────────────────────────────────────
CREATE TABLE password_reset_tokens (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_password_reset_hash UNIQUE (token_hash)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_username ON users(username);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

CREATE INDEX idx_refresh_tokens_user       ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash       ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires    ON refresh_tokens(expires_at);

CREATE INDEX idx_oauth_accounts_user       ON oauth_accounts(user_id);

CREATE INDEX idx_password_reset_user       ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_hash       ON password_reset_tokens(token_hash);

-- ─── Seed data ───────────────────────────────────────────────────────────────
INSERT INTO roles (name) VALUES ('ROLE_USER'), ('ROLE_ADMIN');
