BEGIN;

ALTER TABLE mergestat.repo_syncs DROP COLUMN IF EXISTS sync_interval_seconds;

COMMIT;
