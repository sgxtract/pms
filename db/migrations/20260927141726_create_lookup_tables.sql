-- migrate:up
CREATE TABLE procurement_stages (
  id         smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code       text NOT NULL,
  name       text NOT NULL,
  sort_order smallint NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT procurement_stages_code_key UNIQUE (code),
  CONSTRAINT procurement_stages_name_key UNIQUE (name),
  CONSTRAINT procurement_stages_code_format CHECK (code ~ '^[a-z_]+$')
);

CREATE TABLE procurement_modes (
  id         smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       text NOT NULL,
  sort_order smallint NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT procurement_modes_name_key UNIQUE (name)
);

CREATE TABLE pr_types (
  id         smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       text NOT NULL,
  sort_order smallint NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pr_types_name_key UNIQUE (name)
);

CREATE TRIGGER procurement_stages_set_updated_at
  BEFORE UPDATE ON procurement_stages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER procurement_modes_set_updated_at
  BEFORE UPDATE ON procurement_modes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER pr_types_set_updated_at
  BEFORE UPDATE ON pr_types
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO procurement_stages (code, name, sort_order) VALUES
  ('received',                     'Received',                     10),
  ('pre_procurement',              'Pre-Procurement',              20),
  ('posting',                      'Posting',                      30),
  ('pre_bid',                      'Pre-Bid',                      40),
  ('opening',                      'Opening',                      50),
  ('evaluation',                   'Evaluation',                   60),
  ('post_qualification',           'Post-Qualification',           70),
  ('notice_of_post_qualification', 'Notice of Post-Qualification', 80),
  ('notice_of_award',              'Notice of Award',              90),
  ('notice_to_proceed',            'Notice to Proceed',            100),
  ('completed',                    'Completed',                    110);

INSERT INTO procurement_modes (name, sort_order) VALUES
  ('Competitive Bidding',     10),
  ('Small Value Procurement', 20),
  ('Negotiated Procurement',  30);

INSERT INTO pr_types (name, sort_order) VALUES
  ('Goods',          10),
  ('Medicines',      20),
  ('Infrastructure', 30),
  ('Services',       40);

-- migrate:down
DROP TABLE IF EXISTS pr_types;
DROP TABLE IF EXISTS procurement_modes;
DROP TABLE IF EXISTS procurement_stages;