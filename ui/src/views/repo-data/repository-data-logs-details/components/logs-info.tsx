import { KeyValue } from '@mergestat/blocks'
import React from 'react'
import { RepoSyncStateT } from 'src/@types'
import { RelativeTimeField } from 'src/components/Fields/relative-time-field'
import { SyncRunningProgress } from 'src/components/SyncRunningProgress'
import { SYNC_STATUS } from 'src/utils/constants'

type LogsInfoProps = {
  id: string
  syncStart: string
  duration: string
  status?: RepoSyncStateT
  latestLog?: string
}

export const LogsInfo: React.FC<LogsInfoProps> = (props) => {
  const isRunning = String(props.status) === SYNC_STATUS.running

  return (
    <div className="bg-white rounded-md px-6 py-7 text-gray-600 font-medium border shadow-sm space-y-5">
      {isRunning && (
        <div className="space-y-2 max-w-3xl">
          <SyncRunningProgress startedAt={props.syncStart} />
          {props.latestLog && (
            <p className="text-sm t-text-muted font-normal truncate">{props.latestLog}</p>
          )}
        </div>
      )}
      <div className="flex justify-between items-center max-w-3xl space-x-8">
        <div className="flex flex-col">
          <KeyValue title="Sync start" />
          <RelativeTimeField date={props.syncStart} />
        </div>

        <div className="border-l pl-8">
          <KeyValue
            title="Duration"
            value={isRunning ? '—' : props.duration}
          />
        </div>

        <div className="border-l pl-8">
          <KeyValue
            title="ID"
            value={props.id}
          />
        </div>
      </div>
    </div>
  )
}
