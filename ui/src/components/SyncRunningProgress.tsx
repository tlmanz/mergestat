import React, { useEffect, useState } from 'react'
import { getSimpleDurationTime } from 'src/utils'

type SyncRunningProgressProps = {
  /** ISO timestamp of when the run started. */
  startedAt: string
}

/**
 * Tier-1 live progress affordance for a running sync: a ticking "Running for X"
 * label plus an indeterminate (pulsing) bar. Sync handlers don't report a true
 * percentage, so this conveys liveness/elapsed rather than completion.
 */
export const SyncRunningProgress: React.FC<SyncRunningProgressProps> = ({ startedAt }) => {
  const [now, setNow] = useState<Date>(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const elapsed = startedAt ? getSimpleDurationTime(new Date(startedAt), now) : ''

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
        <span>Running{elapsed ? ` for ${elapsed}` : ''}…</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded bg-gray-100">
        <div className="h-full w-full animate-pulse rounded bg-blue-400" />
      </div>
    </div>
  )
}
