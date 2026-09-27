-- migrate:up
CREATE TABLE pr_categories (
  id         smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       text NOT NULL,
  sort_order smallint NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pr_categories_name_key UNIQUE (name)
);

CREATE TRIGGER pr_categories_set_updated_at
  BEFORE UPDATE ON pr_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO pr_categories (name, sort_order) VALUES
  ('Office',   10),
  ('Hospital', 20),
  ('7K / SEF', 30);

-- migrate:down
DROP TABLE IF EXISTS pr_categories;