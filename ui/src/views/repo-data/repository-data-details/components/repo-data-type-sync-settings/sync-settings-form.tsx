import { ApolloError } from '@apollo/client'
import { Button, HelpText, Input, Label, Panel, Select, Toggle } from '@mergestat/blocks'
import React, { ChangeEvent, PropsWithChildren, useEffect, useState } from 'react'
import { ScheduleMutation } from 'src/api-logic/graphql/generated/schema'
import Loading from 'src/components/Loading'
import { showErrorAlert, showSuccessAlert } from 'src/utils/alerts'
import { SYNC_CRON_PRESETS, SYNC_INTERVAL_OPTIONS } from 'src/utils/constants'
import useSyncsLogs from 'src/views/hooks/useSyncsLogs'

export const SyncSettingsForm = () => {
  const { loading, repoData, syncTypeId, updateSchedule, updateSyncInterval, updateSyncCron } = useSyncsLogs()

  const [cron, setCron] = useState<string>('')
  useEffect(() => {
    setCron(repoData.sync?.scheduleCron ?? '')
  }, [repoData.sync?.scheduleCron])

  const cronActive = (repoData.sync?.scheduleCron ?? '') !== ''

  const onIntervalChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const seconds = Number(e.target.value)
    updateSyncInterval({
      variables: { syncId: syncTypeId, seconds: seconds === 0 ? null : seconds },
      onCompleted() { showSuccessAlert('Sync interval updated') },
      onError(error: ApolloError) { showErrorAlert(error.message) },
    })
  }

  const saveCron = (value: string) => {
    const trimmed = value.trim()
    updateSyncCron({
      variables: { syncId: syncTypeId, cron: trimmed === '' ? null : trimmed },
      onCompleted() { showSuccessAlert(trimmed === '' ? 'Cron schedule cleared' : 'Cron schedule updated') },
      onError(error: ApolloError) { showErrorAlert(error.message) },
    })
  }

  return (
    <>
      {loading
        ? <Loading />
        : <Panel className="shadow-sm">
          <Panel.Header>
            <h3 className="t-panel-title">Sync settings</h3>
          </Panel.Header>
          <Panel.Body>
            <form className="flex flex-col gap-4">
              <Formrow>
                <Label className='text-gray-600 font-medium'>Schedule</Label>
                <div className="w-64 flex gap-2 items-center">
                  <Toggle
                    isChecked={repoData.sync?.scheduleEnabled || false}
                    onChange={() => updateSchedule({
                      variables: { syncId: syncTypeId, schedule: !repoData.sync?.scheduleEnabled },
                      onCompleted(data: ScheduleMutation) {
                        showSuccessAlert(`Schedule ${data.updateRepoSync?.repoSync?.scheduleEnabled ? 'enabled' : 'disabled'}`)
                      },
                      onError(error: ApolloError) { showErrorAlert(error.message) },
                    })}
                  />
                  <span className="t-text-default">Enable</span>
                </div>
              </Formrow>

              <Formrow>
                <div className="flex flex-col">
                  <Label className='text-gray-600 font-medium'>Minimum interval</Label>
                  <HelpText className='t-text-muted'>{cronActive ? 'Ignored while a cron schedule is set' : 'Throttle how often this sync runs'}</HelpText>
                </div>
                <div className="w-64">
                  <Select
                    id='syncInterval'
                    className="w-full"
                    value={repoData.sync?.syncIntervalSeconds ?? 0}
                    disabled={!repoData.sync?.scheduleEnabled || cronActive}
                    onChange={onIntervalChange}
                  >
                    {SYNC_INTERVAL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
              </Formrow>

              <Formrow>
                <div className="flex flex-col">
                  <Label className='text-gray-600 font-medium'>Cron schedule</Label>
                  <HelpText className='t-text-muted'>Optional 5-field cron (UTC). Overrides the interval. e.g. <code>0 2 * * *</code> = nightly 2am</HelpText>
                </div>
                <div className="w-64 flex flex-col gap-2">
                  <Input
                    value={cron}
                    placeholder='e.g. 0 2 * * *'
                    disabled={!repoData.sync?.scheduleEnabled}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCron(e.target.value)}
                    onBlur={() => saveCron(cron)}
                    onKeyPress={(e) => (e.key === 'Enter' && saveCron(cron))}
                  />
                  <div className="flex flex-wrap gap-1">
                    {SYNC_CRON_PRESETS.map((p) => (
                      <Button key={p.value} size='small' skin='borderless' label={p.label}
                        disabled={!repoData.sync?.scheduleEnabled}
                        onClick={() => { setCron(p.value); saveCron(p.value) }}
                      />
                    ))}
                  </div>
                </div>
              </Formrow>
            </form>
          </Panel.Body>
        </Panel>}
    </>
  )
}

const Formrow: React.FC<PropsWithChildren> = (props: PropsWithChildren) => {
  return (
    <div className="flex items-center justify-between w-full max-w-md">
      {props.children}
    </div>
  )
}
