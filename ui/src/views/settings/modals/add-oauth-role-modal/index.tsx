import { useMutation } from '@apollo/client'
import { Button, Input, Label, Modal, Toolbar } from '@mergestat/blocks'
import { XIcon } from '@mergestat/icons'
import cx from 'classnames'
import React, { ChangeEvent, useCallback, useState } from 'react'
import { SET_OAUTH_ROLE, SetOauthRoleMutation } from 'src/api-logic/graphql/mutations/manage-oauth-roles'
import { useOauthRolesSetState } from 'src/state/contexts/oauth-roles.context'
import { showSuccessAlert } from 'src/utils/alerts'
import { USER_ROLES } from 'src/utils/constants'

export const AddOauthRoleModal: React.FC = () => {
  const { setShowAddOauthRoleModal } = useOauthRolesSetState()

  const [setOauthRole] = useMutation(SET_OAUTH_ROLE, {
    errorPolicy: 'all',
    onCompleted: (data: SetOauthRoleMutation) => {
      data.oauthUserMgmtSetRole && showSuccessAlert('OAuth role saved')
    },
    awaitRefetchQueries: true,
    refetchQueries: () => ['getOauthRoles']
  })

  const close = useCallback(() => {
    setShowAddOauthRoleModal(false)
  }, [setShowAddOauthRoleModal])

  const [email, setEmail] = useState<string>()
  const [role, setRole] = useState<string>()

  const onChangeValue = (event: ChangeEvent<HTMLInputElement>) => {
    setRole(event.target.value)
  }

  const handleSave = () => {
    if (!email || !role) return
    setOauthRole({ variables: { email, role } })
    close()
  }

  return (
    <Modal open onClose={close} size='md'>
      <Modal.Header>
        <Toolbar className='h-16 px-6'>
          <Toolbar.Left>
            <Toolbar.Item>
              <Modal.Title>Add OAuth role</Modal.Title>
            </Toolbar.Item>
          </Toolbar.Left>
          <Toolbar.Right>
            <Toolbar.Item>
              <Button skin='borderless-muted' startIcon={<XIcon className='t-icon' />} onClick={close} />
            </Toolbar.Item>
          </Toolbar.Right>
        </Toolbar>
      </Modal.Header>
      <Modal.Body>
        <div className='p-6'>
          <form className='space-y-6'>
            <div>
              <Label>Email</Label>
              <Input value={email || ''} placeholder='user@example.com'
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                onKeyPress={(e) => (e.key === 'Enter' && handleSave())}
              />
            </div>
            <div>
              <Label>Role</Label>
              <div className='space-y-3'>
                {USER_ROLES.map((r, index) => (
                  <div key={index} onChange={onChangeValue}>
                    <label htmlFor={`radio-oauth-role-${index}`} className='t-radio space-x-4'>
                      <div className={cx('t-radio-card w-full', { 't-radio-card-selected': role === r.key })}>
                        <div className='self-start'>
                          <input id={`radio-oauth-role-${index}`}
                            readOnly
                            type='radio'
                            name='oauth-role'
                            value={r.key || ''}
                            checked={r ? role === r.key : undefined}
                          />
                        </div>
                        <div>
                          <h4 className='font-medium mb-0.5'>{r.name}</h4>
                          <p className='font-normal text-sm t-text-muted'>{r.desc}</p>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Toolbar className='h-16 px-6'>
          <Toolbar.Right>
            <div className='t-button-toolbar'>
              <Button skin='secondary' label='Cancel' onClick={close} />
              <Button label='Save' disabled={!email || !role} onClick={handleSave} />
            </div>
          </Toolbar.Right>
        </Toolbar>
      </Modal.Footer>
    </Modal>
  )
}
