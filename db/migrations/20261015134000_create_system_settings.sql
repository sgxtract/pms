-- migrate:up
CREATE TABLE system_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by bigint REFERENCES users (id),

  CONSTRAINT system_settings_key_format CHECK (key ~ '^[a-z_]+$'),
  CONSTRAINT system_settings_value_is_object CHECK (jsonb_typeof(value) = 'object')
);

CREATE TRIGGER system_settings_set_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO system_settings (key, value) VALUES (
  'report_signatories',
  '{"preparedBy": {"name": "", "position": ""}, "notedBy": {"name": "", "position": ""}}'
);

-- migrate:down
DROP TABLE IF EXISTS system_settings;
