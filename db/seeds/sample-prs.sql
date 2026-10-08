-- DEVELOPMENT ONLY. Creates 120 sample PRs (numbers SAMPLE-0001 to
-- SAMPLE-0120) for testing lists, filters, and pagination.
-- Each gets a single history entry at its current stage.

BEGIN;

WITH new_prs AS (
  INSERT INTO procurement_requests (
    pr_number, pr_date, pr_category_id, pr_type_id, end_user, particulars,
    abc, source_of_funds, procurement_mode_id, calendar_days, account_code,
    current_stage_id, current_stage_at, status, created_by, updated_by
  )
  SELECT
    'SAMPLE-' || lpad(n::text, 4, '0'),
    current_date - n * 2,
    (SELECT id FROM pr_categories ORDER BY id OFFSET n % 3 LIMIT 1),
    (SELECT id FROM pr_types ORDER BY id OFFSET n % 4 LIMIT 1),
    (ARRAY['General Services Office', 'Provincial Health Office',
           'Provincial Engineering Office', 'Provincial Agriculture Office',
           'Provincial Hospital'])[1 + n % 5],
    (ARRAY['Supply and delivery of office equipment',
           'Procurement of medicines and medical supplies',
           'Repair of provincial road',
           'Catering services for training',
           'Purchase of laboratory reagents',
           'Construction of multi-purpose building'])[1 + n % 6]
      || ' (sample ' || n || ')',
    round((50000 + random() * 4950000)::numeric, 2),
    (ARRAY['General Fund', 'Special Education Fund', '20% Development Fund'])[1 + n % 3],
    (SELECT id FROM procurement_modes ORDER BY id OFFSET n % 3 LIMIT 1),
    CASE WHEN n % 2 = 0 THEN 30 + (n % 4) * 15 END,
    (ARRAY['5-02-03-010', '5-02-03-070', '5-02-13-040'])[1 + n % 3],
    (SELECT id FROM procurement_stages ORDER BY sort_order OFFSET n % 11 LIMIT 1),
    now() - make_interval(days => n),
    CASE WHEN n % 13 = 0 THEN 'cancelled' ELSE 'active' END,
    (SELECT id FROM users WHERE role = 'admin' AND is_active ORDER BY id LIMIT 1),
    (SELECT id FROM users WHERE role = 'admin' AND is_active ORDER BY id LIMIT 1)
  FROM generate_series(1, 120) AS n
  RETURNING id, current_stage_id, current_stage_at, created_by
)
INSERT INTO pr_stage_history (pr_id, to_stage_id, effective_at, recorded_by, remarks)
SELECT id, current_stage_id, current_stage_at, created_by, 'Sample data'
FROM new_prs;

COMMIT;