BEGIN;

-- Per-sync minimum interval (cooldown) between *scheduled* runs.
-- NULL (the default) preserves the previous behaviour: the scheduler may
-- re-enqueue a sync as soon as its previous run completes. A non-NULL value
-- means the scheduler will not re-enqueue until at least that many seconds have
-- elapsed since the last completed run. Manual "Sync Now" is unaffected.
ALTER TABLE mergestat.repo_syncs
ADD COLUMN IF NOT EXISTS sync_interval_seconds INTEGER;

COMMENT ON COLUMN mergestat.repo_syncs.sync_interval_seconds IS
    'Minimum seconds between scheduled runs of this sync (cooldown). NULL means no minimum. Manual "Sync Now" is not affected.';

COMMIT;
