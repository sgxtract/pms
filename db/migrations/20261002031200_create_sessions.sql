-- migrate:up
CREATE TABLE sessions (
  id               text PRIMARY KEY,
  user_id          bigint NOT NULL REFERENCES users (id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NOT NULL,
  ip_address       inet,
  user_agent       text,

  CONSTRAINT sessions_expires_after_created CHECK (expires_at > created_at)
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

-- migrate:down
DROP TABLE IF EXISTS sessions;