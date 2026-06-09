package scheduler

import (
	"context"
	"database/sql"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/mergestat/mergestat/internal/db"
	"github.com/robfig/cron/v3"
	"github.com/rs/zerolog"
)

// cronParser parses standard 5-field cron expressions (minute hour dom month dow).
var cronParser = cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow)

type scheduler struct {
	logger *zerolog.Logger
	pool   *pgxpool.Pool
	db     *db.Queries
}

func New(logger *zerolog.Logger, pool *pgxpool.Pool) *scheduler {
	return &scheduler{
		logger: logger,
		pool:   pool,
		db:     db.New(pool),
	}
}

func (s *scheduler) Start(ctx context.Context, interval time.Duration) {
	s.logger.Info().Msg("starting scheduler")
	exec := func() {
		if err := s.db.EnqueueAllSyncs(ctx); err != nil {
			s.logger.Err(err).Msg("encountered error during scheduler execution")
		} else {
			s.logger.Info().Msg("re-scheduling all completed syncs to run again")
		}

		// enqueue any cron-scheduled syncs that are due, then advance their next_run_at
		s.enqueueCronSyncs(ctx)

		// TODO(patrickdevivo) this should probably be lifted up into a config/param
		// of the scheduler, which is passed into New and defined by the caller
		retentionPeriodDays := 30
		if days := os.Getenv("REPO_SYNC_QUEUE_RETENTION_DAYS"); days != "" {
			var err error
			if retentionPeriodDays, err = strconv.Atoi(days); err != nil {
				s.logger.Err(err).Msgf("could not parse REPO_SYNC_QUEUE_RETENTION_DAYS env: %v", err)
			}
		}

		// allows for REPO_SYNC_QUEUE_RETENTION_DAYS=-1 to skip the cleanup
		if retentionPeriodDays > 0 {
			if err := s.db.CleanOldRepoSyncQueue(ctx, int32(retentionPeriodDays)); err != nil {
				s.logger.Err(err).Msg("encountered error cleaning queue logs")
			} else {
				s.logger.Info().Msgf("successfully removed repo sync jobs older than %d days", retentionPeriodDays)
			}

			if err := s.db.CleanOldJobs(ctx, int32(retentionPeriodDays)); err != nil {
				s.logger.Err(err).Msg("encountered error cleaning sqlq logs")
			} else {
				s.logger.Info().Msgf("successfully removed sqlq jobs older than %d days", retentionPeriodDays)
			}
		}
	}
	exec()

	for {
		select {
		case <-ctx.Done():
			s.logger.Info().Msg("stopping scheduler")
			return
		case <-time.After(interval):
			exec()
		}
	}
}

// enqueueCronSyncs enqueues every cron-scheduled sync that is due, then advances its
// next_run_at to the next occurrence of its cron expression. Cron-scheduled syncs are
// excluded from EnqueueAllSyncs, so this is the only path that enqueues them.
func (s *scheduler) enqueueCronSyncs(ctx context.Context) {
	due, err := s.db.ListDueCronSyncs(ctx)
	if err != nil {
		s.logger.Err(err).Msg("could not list due cron syncs")
		return
	}

	now := time.Now()
	for _, sync := range due {
		if !sync.ScheduleCron.Valid {
			continue
		}

		schedule, err := cronParser.Parse(sync.ScheduleCron.String)
		if err != nil {
			s.logger.Warn().Err(err).Msgf("invalid cron expression %q for repo sync %s; skipping", sync.ScheduleCron.String, sync.ID)
			continue
		}

		if err := s.db.EnqueueRepoSync(ctx, sync.ID); err != nil {
			s.logger.Err(err).Msgf("could not enqueue cron sync %s", sync.ID)
			continue
		}

		if err := s.db.SetSyncNextRunAt(ctx, db.SetSyncNextRunAtParams{
			ID:        sync.ID,
			NextRunAt: sql.NullTime{Time: schedule.Next(now), Valid: true},
		}); err != nil {
			s.logger.Err(err).Msgf("could not set next_run_at for cron sync %s", sync.ID)
		}
	}
}
