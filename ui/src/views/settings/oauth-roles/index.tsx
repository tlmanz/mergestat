import { useQuery } from '@apollo/client'
import { Avatar, Button, Input, Panel, Toolbar } from '@mergestat/blocks'
import { PencilIcon, PlusIcon, SearchIcon, TrashIcon, UserIcon } from '@mergestat/icons'
import { debounce } from 'lodash'
import type { NextPage } from 'next'
import { Fragment, useEffect, useState } from 'react'
import { LIST_OAUTH_ROLES } from 'src/api-logic/graphql/queries/get-oauth-roles'
import { GetOauthRolesQuery, mapToOauthRoleData, OAuthRoleData } from 'src/api-logic/mappers/oauth-roles'
import Loading from 'src/components/Loading'
import { useOauthRolesContext, useOauthRolesSetState } from 'src/state/contexts/oauth-roles.context'
import { USER_ROLES } from 'src/utils/constants'
import SettingsView from 'src/views/settings'
import { AddOauthRoleModal } from 'src/views/settings/modals/add-oauth-role-modal'
import { EditOauthRoleModal } from 'src/views/settings/modals/edit-oauth-role-modal'
import { RemoveOauthRoleModal } from 'src/views/settings/modals/remove-oauth-role-modal'

const roleLabel = (key: string): string => USER_ROLES.find((r) => r.key === key)?.name ?? key

const OauthRoles: NextPage = () => {
  const [{ showAddOauthRoleModal, showEditOauthRoleModal, showRemoveOauthRoleModal }] = useOauthRolesContext()
  const { setShowAddOauthRoleModal, setShowEditOauthRoleModal, setShowRemoveOauthRoleModal, setEmailEdit, setRoleEdit } = useOauthRolesSetState()
  const [roles, setRoles] = useState<OAuthRoleData[]>([])
  const [search, setSearch] = useState<string>('')

  const { loading, data, refetch } = useQuery<GetOauthRolesQuery>(LIST_OAUTH_ROLES, {
    variables: { search },
    fetchPolicy: 'no-cache'
  })

  const handleEdit = (email: string, role: string) => {
    setEmailEdit(email)
    setRoleEdit(role)
    setShowEditOauthRoleModal(true)
  }

  const handleRemove = (email: string) => {
    setEmailEdit(email)
    setShowRemoveOauthRoleModal(true)
  }

  const onChange = debounce((e) => setSearch(e.target.value), 300)

  useEffect(() => {
    setRoles(mapToOauthRoleData(data))
  }, [data])

  useEffect(() => {
    refetch({ search })
  }, [refetch, search])

  return (
    <>
      <Fragment>
        <SettingsView>
          <div className='flex flex-col flex-1 overflow-hidden'>
            <div className='bg-white h-16 w-full border-b px-8'>
              <Toolbar className='h-full'>
                <Toolbar.Left>
                  <h2 className='t-h2 mb-0'>OAuth User Roles</h2>
                </Toolbar.Left>
                <Toolbar.Right>
                  <Button className='whitespace-nowrap'
                    label='Add OAuth role'
                    startIcon={<PlusIcon className='t-icon' />}
                    onClick={() => setShowAddOauthRoleModal(true)}
                  />
                </Toolbar.Right>
              </Toolbar>
            </div>
            <div className='flex-1 overflow-auto p-8'>
              <p className='t-text-muted mb-6 max-w-3xl'>
                Map OAuth (SSO) users to MergeStat roles by email. Users without an entry get the
                configured default role. Changes take effect on the user&#39;s next login.
              </p>
              <div className='mb-6'>
                <Input
                  placeholder='Search by email...'
                  startIcon={<SearchIcon className='t-icon t-icon-muted' />}
                  className='xl_w-3/5'
                  onChange={onChange}
                />
              </div>
              {loading
                ? <Loading />
                : roles.length < 1
                  ? <Panel className='rounded-md w-full shadow-sm'>
                    <Panel.Body className='p-0'>
                      <div className='flex justify-center items-center bg-white py-5'>
                        No OAuth role overrides yet
                      </div>
                    </Panel.Body>
                  </Panel>
                  : <Panel className='rounded-md w-full shadow-sm'>
                    <Panel.Body className='p-0 overflow-hidden'>
                      <div className='flex-1 overflow-x-auto overflow-y-hidden'>
                        <table className='t-table-default'>
                          <thead>
                            <tr className='bg-white'>
                              <th scope='col' className='whitespace-nowrap w-1'>Email</th>
                              <th scope='col' className='whitespace-nowrap w-1'>Role</th>
                              <th scope='col' className='whitespace-nowrap w-1'></th>
                            </tr>
                          </thead>
                          <tbody className='bg-white'>
                            {roles.map((entry, index) => (
                              <tr key={index}>
                                <td>
                                  <div className='flex items-center gap-4'>
                                    <Avatar icon={<UserIcon className='t-icon' />} />
                                    <span className='whitespace-nowrap font-medium'>{entry.email}</span>
                                  </div>
                                </td>
                                <td className='whitespace-nowrap'>{roleLabel(entry.role)}</td>
                                <td className='text-gray-500 text-right py-4'>
                                  <Button
                                    skin='borderless-muted'
                                    className='mr-5'
                                    startIcon={<PencilIcon className='t-icon' />}
                                    onClick={() => handleEdit(entry.email, entry.role)}
                                    isIconOnly
                                  />
                                  <Button
                                    skin='borderless-muted'
                                    startIcon={<TrashIcon className='t-icon' />}
                                    onClick={() => handleRemove(entry.email)}
                                    isIconOnly
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Panel.Body>
                  </Panel>
              }
            </div>
          </div>
        </SettingsView>
      </Fragment>
      {showAddOauthRoleModal && <AddOauthRoleModal />}
      {showEditOauthRoleModal && <EditOauthRoleModal />}
      {showRemoveOauthRoleModal && <RemoveOauthRoleModal />}
    </>
  )
}

export default OauthRoles
