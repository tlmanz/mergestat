BEGIN;

ALTER TABLE mergestat.repo_syncs
DROP COLUMN IF EXISTS next_run_at,
DROP COLUMN IF EXISTS schedule_cron;

COMMIT;
