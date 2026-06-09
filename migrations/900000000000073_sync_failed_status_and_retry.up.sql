BEGIN;

-- First-class FAILED terminal status for sync jobs (previously failures were just
-- marked DONE and inferred from the presence of ERROR logs).
INSERT INTO mergestat.repo_sync_queue_status_types (type, description)
VALUES ('FAILED', 'Sync job failed (errored or timed out) after exhausting retries')
ON CONFLICT DO NOTHING;

-- Retry bookkeeping per queued run.
ALTER TABLE mergestat.repo_sync_queue
    ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

-- Teach the status trigger to stamp done_at when a job reaches the terminal FAILED state.
CREATE OR REPLACE FUNCTION public.repo_sync_queue_status_update_trigger() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'RUNNING' AND OLD.status = 'QUEUED' THEN
        NEW.started_at = now();
    ELSEIF NEW.status = 'DONE' AND OLD.status = 'RUNNING' THEN
        NEW.done_at = now();
    ELSEIF NEW.status = 'FAILED' AND OLD.status = 'RUNNING' THEN
        NEW.done_at = now();
    END IF;
    RETURN NEW;
END;
$$;

-- On a failed run, either schedule a retry (exponential backoff) or, once the retry
-- budget is exhausted, mark the job terminally FAILED. In the FAILED case we also advance
-- the repo_sync's fairness anchor (last_completed_repo_sync_queue_id) so a perpetually
-- failing repo stops hogging the front of the dequeue ordering.
CREATE OR REPLACE FUNCTION mergestat.fail_or_retry_sync_job(_id BIGINT, _max_retries INT, _backoff_seconds INT)
RETURNS TEXT AS
$$
DECLARE
    _retry_count INT;
    _new_status  TEXT;
BEGIN
    SELECT retry_count INTO _retry_count FROM mergestat.repo_sync_queue WHERE id = _id;

    IF _retry_count < _max_retries THEN
        UPDATE mergestat.repo_sync_queue
            SET status = 'QUEUED',
                retry_count = retry_count + 1,
                -- exponential backoff; exponent capped to avoid runaway delays
                next_retry_at = now() + ((_backoff_seconds * power(2, LEAST(retry_count, 6)))::INT * interval '1 second'),
                started_at = NULL,
                last_keep_alive = NULL
            WHERE id = _id;
        _new_status := 'QUEUED';
    ELSE
        WITH upd AS (
            UPDATE mergestat.repo_sync_queue SET status = 'FAILED' WHERE id = _id RETURNING repo_sync_id
        )
        UPDATE mergestat.repo_syncs SET last_completed_repo_sync_queue_id = _id
        FROM upd WHERE mergestat.repo_syncs.id = upd.repo_sync_id;
        _new_status := 'FAILED';
    END IF;

    RETURN _new_status;
END;
$$ LANGUAGE plpgsql;

COMMIT;
