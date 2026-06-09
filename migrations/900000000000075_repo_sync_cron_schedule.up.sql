BEGIN;

-- Optional per-sync cron schedule. When schedule_cron is set, the sync runs on that
-- cron schedule (e.g. nightly) instead of continuously; the min-interval cooldown
-- (sync_interval_seconds) is ignored for cron-scheduled syncs. next_run_at is maintained
-- by the scheduler, which parses the cron expression and advances it after each run.
ALTER TABLE mergestat.repo_syncs
ADD COLUMN IF NOT EXISTS schedule_cron TEXT,
ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMPTZ;

COMMENT ON COLUMN mergestat.repo_syncs.schedule_cron IS
'Optional standard 5-field cron expression. When set, this sync runs on the cron schedule instead of continuously; sync_interval_seconds is ignored.';
COMMENT ON COLUMN mergestat.repo_syncs.next_run_at IS
'Next time a cron-scheduled run is due (maintained by the scheduler).';

COMMIT;
