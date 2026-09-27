-- migrate:up
CREATE TABLE
    users (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        employee_id text NOT NULL,
        full_name text NOT NULL,
        role text NOT NULL,
        user_type text,
        password_hash text NOT NULL,
        must_change_password boolean NOT NULL DEFAULT true,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now (),
        created_by bigint REFERENCES users (id),
        updated_at timestamptz NOT NULL DEFAULT now (),
        updated_by bigint REFERENCES users (id),
        CONSTRAINT users_employee_id_key UNIQUE (employee_id),
        CONSTRAINT users_employee_id_format CHECK (
            employee_id = upper(btrim (employee_id))
            AND employee_id <> ''
        ),
        CONSTRAINT users_full_name_length CHECK (char_length(btrim (full_name)) BETWEEN 1 AND 150),
        CONSTRAINT users_role_valid CHECK (role IN ('admin', 'moderator', 'user')),
        CONSTRAINT users_user_type_valid CHECK (user_type IN ('secretariat', 'twg', 'member')),
        CONSTRAINT users_user_type_matches_role CHECK (
            (
                role = 'user'
                AND user_type IS NOT NULL
            )
            OR (
                role <> 'user'
                AND user_type IS NULL
            )
        )
    );

CREATE TRIGGER users_set_updated_at BEFORE
UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at ();

-- migrate:down
DROP TABLE IF EXISTS users;