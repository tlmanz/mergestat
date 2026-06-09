import { useQuery } from '@apollo/client'
import { Label, Panel, Toolbar } from '@mergestat/blocks'
import { format } from 'date-fns'
import type { NextPage } from 'next'
import { Fragment } from 'react'
import { GET_AUDIT_LOG } from 'src/api-logic/graphql/queries/get-audit-log'
import Loading from 'src/components/Loading'
import { DATE_FORMAT } from 'src/utils/constants'
import SettingsView from 'src/views/settings'

type AuditEntry = {
  id: string
  actor: string
  action: string
  target: string
  detail?: string | null
  createdAt: string
}

type GetAuditLogQuery = {
  userMgmtAuditLogs?: { nodes: Array<AuditEntry> } | null
}

const ACTION_LABELS: Record<string, string> = {
  ADD_USER: 'Added user',
  REMOVE_USER: 'Removed user',
  SET_ROLE: 'Set role',
  SET_OAUTH_ROLE: 'Set OAuth role',
  UPDATE_OAUTH_ROLE: 'Updated OAuth role',
  REMOVE_OAUTH_ROLE: 'Removed OAuth role',
}

const AuditLog: NextPage = () => {
  const { loading, data } = useQuery<GetAuditLogQuery>(GET_AUDIT_LOG, {
    variables: { first: 200 },
    fetchPolicy: 'no-cache',
  })

  const entries = data?.userMgmtAuditLogs?.nodes ?? []

  return (
    <Fragment>
      <SettingsView>
        <div className='flex flex-col flex-1 overflow-hidden'>
          <div className='bg-white h-16 w-full border-b px-8'>
            <Toolbar className='h-full'>
              <Toolbar.Left>
                <h2 className='t-h2 mb-0'>Audit Log</h2>
              </Toolbar.Left>
            </Toolbar>
          </div>
          <div className='flex-1 overflow-auto p-8'>
            <p className='t-text-muted mb-6 max-w-3xl'>
              Append-only record of user and role-management actions.
            </p>
            {loading
              ? <Loading />
              : entries.length < 1
                ? <Panel className='rounded-md w-full shadow-sm'>
                  <Panel.Body className='p-0'>
                    <div className='flex justify-center items-center bg-white py-5'>No activity yet</div>
                  </Panel.Body>
                </Panel>
                : <Panel className='rounded-md w-full shadow-sm'>
                  <Panel.Body className='p-0 overflow-hidden'>
                    <div className='flex-1 overflow-x-auto overflow-y-hidden'>
                      <table className='t-table-default'>
                        <thead>
                          <tr className='bg-white'>
                            <th scope='col' className='whitespace-nowrap'>When</th>
                            <th scope='col' className='whitespace-nowrap'>Actor</th>
                            <th scope='col' className='whitespace-nowrap'>Action</th>
                            <th scope='col' className='whitespace-nowrap'>Target</th>
                            <th scope='col' className='whitespace-nowrap'>Detail</th>
                          </tr>
                        </thead>
                        <tbody className='bg-white'>
                          {entries.map((e) => (
                            <tr key={e.id}>
                              <td className='whitespace-nowrap'>{format(new Date(e.createdAt), DATE_FORMAT.B)}</td>
                              <td className='whitespace-nowrap font-medium'>{e.actor}</td>
                              <td className='whitespace-nowrap'>
                                <Label>{ACTION_LABELS[e.action] ?? e.action}</Label>
                              </td>
                              <td className='whitespace-nowrap'>{e.target}</td>
                              <td className='whitespace-nowrap t-text-muted'>{e.detail ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Panel.Body>
                </Panel>}
          </div>
        </div>
      </SettingsView>
    </Fragment>
  )
}

export default AuditLog
