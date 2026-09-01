-- ============================================================================
-- 0005 - USERS TABLE: canonical column types & role enum alignment
-- ----------------------------------------------------------------------------
-- Brings `users` in line with the documented relational contract:
--   id             UUID          PRIMARY KEY  unique user identifier
--   email          VARCHAR(255)  unique user email address
--   phone          VARCHAR(20)   E.164 verified mobile phone number
--   password_hash  VARCHAR(255)  encrypted password credential
--   role           VARCHAR(32)   buyer | supplier | admin | guest
--   created_at     TIMESTAMP     account creation timestamp
--   updated_at     TIMESTAMP     last profile modification
-- Idempotent and safe to re-run.
-- ============================================================================

-- 1. phone -> VARCHAR(20). E.164 is at most 16 characters ("+" + 15 digits),
--    so trim any legacy whitespace/formatting before narrowing the column.
UPDATE users
SET phone = regexp_replace(phone, '[^0-9+]', '', 'g')
WHERE phone <> regexp_replace(phone, '[^0-9+]', '', 'g');

ALTER TABLE users
  ALTER COLUMN phone TYPE VARCHAR(20);

-- 2. password_hash -> VARCHAR(255) (bcrypt/argon2 digests are well under 255).
ALTER TABLE users
  ALTER COLUMN password_hash TYPE VARCHAR(255);

-- 3. role -> VARCHAR(32) and widen the enum check to include 'guest'.
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ALTER COLUMN role TYPE VARCHAR(32);

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('buyer', 'supplier', 'admin', 'guest'));

-- 4. Timestamps -> TIMESTAMP (without time zone), normalised to UTC.
ALTER TABLE users
  ALTER COLUMN created_at TYPE TIMESTAMP USING (created_at AT TIME ZONE 'UTC'),
  ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'UTC'),
  ALTER COLUMN updated_at TYPE TIMESTAMP USING (updated_at AT TIME ZONE 'UTC'),
  ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'UTC');

-- 5. Documentation for downstream consumers / introspection tooling.
COMMENT ON TABLE  users               IS 'Authentication identities for all Nexora actors.';
COMMENT ON COLUMN users.id            IS 'Primary Key, unique user identifier';
COMMENT ON COLUMN users.email         IS 'Unique user email address';
COMMENT ON COLUMN users.phone         IS 'E.164 verified mobile phone number';
COMMENT ON COLUMN users.password_hash IS 'Encrypted password credential';
COMMENT ON COLUMN users.role          IS 'Enum: buyer | supplier | admin | guest';
COMMENT ON COLUMN users.created_at    IS 'Account creation timestamp';
COMMENT ON COLUMN users.updated_at    IS 'Last profile modification';

CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
