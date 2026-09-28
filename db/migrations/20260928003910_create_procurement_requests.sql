-- migrate:up
CREATE TABLE
    procurement_requests (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        pr_number text NOT NULL,
        pr_date date NOT NULL,
        reference_id bigint REFERENCES pr_references (id),
        pr_type_id smallint REFERENCES pr_types (id),
        pr_category_id smallint NOT NULL REFERENCES pr_categories (id),
        end_user text NOT NULL,
        particulars text NOT NULL,
        abc numeric(15, 2) NOT NULL,
        source_of_funds text NOT NULL,
        procurement_mode_id smallint REFERENCES procurement_modes (id),
        calendar_days integer,
        account_code text NOT NULL,
        current_stage_id smallint NOT NULL REFERENCES procurement_stages (id),
        current_stage_at timestamptz NOT NULL,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now (),
        created_by bigint NOT NULL REFERENCES users (id),
        updated_at timestamptz NOT NULL DEFAULT now (),
        updated_by bigint NOT NULL REFERENCES users (id),
        CONSTRAINT procurement_requests_pr_number_key UNIQUE (pr_number),
        CONSTRAINT procurement_requests_pr_number_format CHECK (
            pr_number = upper(btrim (pr_number))
            AND pr_number <> ''
        ),
        CONSTRAINT procurement_requests_end_user_format CHECK (
            end_user = btrim (end_user)
            AND char_length(end_user) BETWEEN 1 AND 200
        ),
        CONSTRAINT procurement_requests_particulars_format CHECK (
            particulars = btrim (particulars)
            AND char_length(particulars) BETWEEN 1 AND 2000
        ),
        CONSTRAINT procurement_requests_source_of_funds_format CHECK (
            source_of_funds = btrim (source_of_funds)
            AND char_length(source_of_funds) BETWEEN 1 AND 200
        ),
        CONSTRAINT procurement_requests_account_code_format CHECK (
            account_code = btrim (account_code)
            AND char_length(account_code) BETWEEN 1 AND 100
        ),
        CONSTRAINT procurement_requests_abc_positive CHECK (abc > 0),
        CONSTRAINT procurement_requests_calendar_days_positive CHECK (calendar_days > 0),
        CONSTRAINT procurement_requests_status_valid CHECK (status IN ('active', 'cancelled'))
    );

CREATE TRIGGER procurement_requests_set_updated_at BEFORE
UPDATE ON procurement_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at ();

-- Filtering by status and stage (PR list, dashboard pipeline)
CREATE INDEX procurement_requests_status_stage_idx ON procurement_requests (status, current_stage_id);

-- Date filters and report periods
CREATE INDEX procurement_requests_pr_date_idx ON procurement_requests (pr_date);

-- Finding all PRs under one Reference ID
CREATE INDEX procurement_requests_reference_id_idx ON procurement_requests (reference_id)
WHERE
    reference_id IS NOT NULL;

-- Fast "contains" search
CREATE INDEX procurement_requests_pr_number_trgm_idx ON procurement_requests USING gin (pr_number gin_trgm_ops);

CREATE INDEX procurement_requests_particulars_trgm_idx ON procurement_requests USING gin (particulars gin_trgm_ops);

CREATE INDEX procurement_requests_end_user_trgm_idx ON procurement_requests USING gin (end_user gin_trgm_ops);

-- migrate:down
DROP TABLE IF EXISTS procurement_requests;