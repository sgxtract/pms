-- migrate:up
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Keeps updated_at current on every UPDATE.
CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- migrate:down
DROP FUNCTION IF EXISTS set_updated_at();
DROP EXTENSION IF EXISTS pg_trgm;