BEGIN;

DROP FUNCTION IF EXISTS mergestat.fail_or_retry_sync_job(BIGINT, INT, INT);

-- Restore the original status trigger (without the FAILED branch).
CREATE OR REPLACE FUNCTION public.repo_sync_queue_status_update_trigger() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'RUNNING' AND OLD.status = 'QUEUED' THEN
        NEW.started_at = now();
    ELSEIF NEW.status = 'DONE' AND OLD.status = 'RUNNING' THEN
        NEW.done_at = now();
    END IF;
    RETURN NEW;
END;
$$;

ALTER TABLE mergestat.repo_sync_queue
    DROP COLUMN IF EXISTS next_retry_at,
    DROP COLUMN IF EXISTS retry_count;

DELETE FROM mergestat.repo_sync_queue_status_types WHERE type = 'FAILED';

COMMIT;
