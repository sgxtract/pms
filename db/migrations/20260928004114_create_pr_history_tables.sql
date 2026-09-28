-- migrate:up
-- Makes a table append-only: rows can be added but never changed or deleted.
CREATE FUNCTION forbid_changes() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% is append-only; rows cannot be updated or deleted', TG_TABLE_NAME;
END;
$$;

CREATE TABLE pr_stage_history (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pr_id         bigint NOT NULL REFERENCES procurement_requests (id),
  from_stage_id smallint REFERENCES procurement_stages (id),
  to_stage_id   smallint NOT NULL REFERENCES procurement_stages (id),
  effective_at  timestamptz NOT NULL,
  recorded_at   timestamptz NOT NULL DEFAULT now(),
  recorded_by   bigint NOT NULL REFERENCES users (id),
  remarks       text,

  CONSTRAINT pr_stage_history_effective_not_future
    CHECK (effective_at <= recorded_at),
  CONSTRAINT pr_stage_history_stage_changes
    CHECK (from_stage_id IS DISTINCT FROM to_stage_id),
  CONSTRAINT pr_stage_history_remarks_format
    CHECK (remarks IS NULL OR (remarks = btrim(remarks) AND char_length(remarks) BETWEEN 1 AND 1000))
);

CREATE INDEX pr_stage_history_pr_id_idx
  ON pr_stage_history (pr_id, effective_at DESC);

CREATE TRIGGER pr_stage_history_append_only
  BEFORE UPDATE OR DELETE ON pr_stage_history
  FOR EACH ROW EXECUTE FUNCTION forbid_changes();

CREATE TABLE pr_status_history (
  id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pr_id    bigint NOT NULL REFERENCES procurement_requests (id),
  action   text NOT NULL,
  remarks  text NOT NULL,
  acted_at timestamptz NOT NULL DEFAULT now(),
  acted_by bigint NOT NULL REFERENCES users (id),

  CONSTRAINT pr_status_history_action_valid
    CHECK (action IN ('cancelled', 'restored')),
  CONSTRAINT pr_status_history_remarks_format
    CHECK (remarks = btrim(remarks) AND char_length(remarks) BETWEEN 1 AND 1000)
);

CREATE INDEX pr_status_history_pr_id_idx
  ON pr_status_history (pr_id, acted_at DESC);

CREATE TRIGGER pr_status_history_append_only
  BEFORE UPDATE OR DELETE ON pr_status_history
  FOR EACH ROW EXECUTE FUNCTION forbid_changes();

-- migrate:down
DROP TABLE IF EXISTS pr_status_history;
DROP TABLE IF EXISTS pr_stage_history;
DROP FUNCTION IF EXISTS forbid_changes();