// Package metrics exposes repo-sync-queue health as Prometheus metrics. A Collector
// periodically queries the database and updates gauges that are served by the worker's
// existing /metrics endpoint (the default Prometheus registry).
package metrics

import (
	"context"
	"time"

	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/mergestat/mergestat/internal/db"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/rs/zerolog"
)

var (
	queueJobs = promauto.NewGaugeVec(prometheus.GaugeOpts{
		Name: "mergestat_repo_sync_queue_jobs",
		Help: "Number of repo sync queue jobs by status (within the retention window).",
	}, []string{"status"})

	oldestQueuedSeconds = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "mergestat_repo_sync_oldest_queued_seconds",
		Help: "Age in seconds of the oldest QUEUED repo sync job (0 if none) — queue latency indicator.",
	})

	failed24h = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "mergestat_repo_sync_failed_24h",
		Help: "Number of repo sync jobs that reached FAILED in the last 24 hours.",
	})

	completed24h = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "mergestat_repo_sync_completed_24h",
		Help: "Number of repo sync jobs that completed (DONE) in the last 24 hours — throughput.",
	})
)

// Collector refreshes the sync-queue gauges from the database on an interval.
type Collector struct {
	logger *zerolog.Logger
	db     *db.Queries
}

func New(logger *zerolog.Logger, pool *pgxpool.Pool) *Collector {
	return &Collector{logger: logger, db: db.New(pool)}
}

// Start refreshes the metrics immediately and then every interval until ctx is canceled.
func (c *Collector) Start(ctx context.Context, interval time.Duration) {
	c.logger.Info().Msg("starting metrics collector")

	collect := func() {
		stats, err := c.db.GetQueueStats(ctx)
		if err != nil {
			c.logger.Err(err).Msg("metrics: could not collect queue stats")
			return
		}
		queueJobs.WithLabelValues("QUEUED").Set(float64(stats.Queued))
		queueJobs.WithLabelValues("RUNNING").Set(float64(stats.Running))
		queueJobs.WithLabelValues("DONE").Set(float64(stats.Done))
		queueJobs.WithLabelValues("FAILED").Set(float64(stats.Failed))
		oldestQueuedSeconds.Set(stats.OldestQueuedSeconds)
		failed24h.Set(float64(stats.Failed24h))
		completed24h.Set(float64(stats.Done24h))
	}

	collect()

	for {
		select {
		case <-ctx.Done():
			c.logger.Info().Msg("stopping metrics collector")
			return
		case <-time.After(interval):
			collect()
		}
	}
}
