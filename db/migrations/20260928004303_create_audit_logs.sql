-- migrate:up
CREATE TABLE audit_logs (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id    bigint REFERENCES users (id),
  actor_role  text,
  action      text NOT NULL,
  entity_type text NOT NULL,
  entity_id   text,
  changes     jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT audit_logs_actor_role_valid
    CHECK (actor_role IN ('admin', 'moderator', 'user')),
  CONSTRAINT audit_logs_actor_consistent
    CHECK ((actor_id IS NULL) = (actor_role IS NULL)),
  CONSTRAINT audit_logs_action_format
    CHECK (action ~ '^[a-z_]+\.[a-z_]+$')
);

CREATE INDEX audit_logs_created_at_idx ON audit_logs (created_at DESC);
CREATE INDEX audit_logs_actor_id_idx ON audit_logs (actor_id, created_at DESC);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id);

CREATE TRIGGER audit_logs_append_only
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION forbid_changes();

-- migrate:down
DROP TABLE IF EXISTS audit_logs;