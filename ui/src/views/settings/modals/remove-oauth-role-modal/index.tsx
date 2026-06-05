import { useMutation } from '@apollo/client'
import { Button, Modal, Toolbar } from '@mergestat/blocks'
import { TrashIcon, XIcon } from '@mergestat/icons'
import React, { useCallback } from 'react'
import { REMOVE_OAUTH_ROLE, RemoveOauthRoleMutation } from 'src/api-logic/graphql/mutations/manage-oauth-roles'
import { useOauthRolesContext, useOauthRolesSetState } from 'src/state/contexts/oauth-roles.context'
import { showSuccessAlert } from 'src/utils/alerts'

export const RemoveOauthRoleModal: React.FC = () => {
  const [{ emailEdit }] = useOauthRolesContext()
  const { setShowRemoveOauthRoleModal } = useOauthRolesSetState()

  const [removeOauthRole] = useMutation(REMOVE_OAUTH_ROLE, {
    errorPolicy: 'all',
    onCompleted: (data: RemoveOauthRoleMutation) => {
      data.oauthUserMgmtRemove && showSuccessAlert('OAuth role override removed')
    },
    awaitRefetchQueries: true,
    refetchQueries: () => ['getOauthRoles']
  })

  const close = useCallback(() => {
    setShowRemoveOauthRoleModal(false)
  }, [setShowRemoveOauthRoleModal])

  const handleRemove = () => {
    emailEdit && removeOauthRole({ variables: { email: emailEdit } })
    close()
  }

  return (
    <Modal open onClose={close} size='sm'>
      <Modal.Header>
        <Toolbar className='h-16 px-6'>
          <Toolbar.Left>
            <Toolbar.Item>
              <Modal.Title>Remove OAuth role override</Modal.Title>
            </Toolbar.Item>
          </Toolbar.Left>
          <Toolbar.Right>
            <Toolbar.Item>
              <Button skin='borderless-muted' onClick={close} startIcon={<XIcon className='t-icon' />} />
            </Toolbar.Item>
          </Toolbar.Right>
        </Toolbar>
      </Modal.Header>
      <Modal.Body>
        <div className='px-6 py-6'>
          Remove the role override for <strong>{emailEdit}</strong>? They will fall back to the
          default OAuth role on their next login.
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Toolbar className='h-16 px-6'>
          <Toolbar.Right>
            <Toolbar.Item>
              <Button skin='secondary' onClick={close} className='my-3 mr-3'>
                Cancel
              </Button>
              <Button skin='danger' startIcon={<TrashIcon className='t-icon' />} className='my-3' onClick={handleRemove}>
                Remove override
              </Button>
            </Toolbar.Item>
          </Toolbar.Right>
        </Toolbar>
      </Modal.Footer>
    </Modal>
  )
}
