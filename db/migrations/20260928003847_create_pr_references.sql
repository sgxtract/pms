-- migrate:up
CREATE TABLE
    pr_references (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        reference_code text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now (),
        created_by bigint NOT NULL REFERENCES users (id),
        updated_at timestamptz NOT NULL DEFAULT now (),
        updated_by bigint NOT NULL REFERENCES users (id),
        CONSTRAINT pr_references_reference_code_key UNIQUE (reference_code),
        CONSTRAINT pr_references_reference_code_format CHECK (
            reference_code = upper(btrim (reference_code))
            AND reference_code <> ''
        )
    );

CREATE TRIGGER pr_references_set_updated_at BEFORE
UPDATE ON pr_references FOR EACH ROW EXECUTE FUNCTION set_updated_at ();

-- migrate:down
DROP TABLE IF EXISTS pr_references;