import { createGenericContext } from 'lib/createGenericContext'
import React, { PropsWithChildren } from 'react'

type OauthRolesContextT = {
  showAddOauthRoleModal: boolean
  showEditOauthRoleModal: boolean
  showRemoveOauthRoleModal: boolean
  emailEdit: string | null
  roleEdit: string | null
}

type UseOauthRolesContextT = [
  OauthRolesContextT,
  React.Dispatch<React.SetStateAction<OauthRolesContextT>>
]

const initialState: OauthRolesContextT = {
  showAddOauthRoleModal: false,
  showEditOauthRoleModal: false,
  showRemoveOauthRoleModal: false,
  emailEdit: null,
  roleEdit: null
}

function useOauthRoles(): UseOauthRolesContextT {
  const [state, setState] = React.useState<OauthRolesContextT>(initialState)
  return [state, setState]
}

// Generate context
const [useOauthRolesContext, OauthRolesContextProvider] = createGenericContext<UseOauthRolesContextT>()

// Generate provider
const OauthRolesProvider: React.FC<PropsWithChildren> = (props: PropsWithChildren) => {
  const [oauthRoles, setOauthRoles] = useOauthRoles()

  return (
    <OauthRolesContextProvider value={[oauthRoles, setOauthRoles]}>
      {props.children}
    </OauthRolesContextProvider>
  )
}

function useOauthRolesSetState() {
  const [_, setState] = useOauthRolesContext()

  const setShowAddOauthRoleModal = (show: boolean) => {
    setState(prev => ({ ...prev, showAddOauthRoleModal: show }))
  }

  const setShowEditOauthRoleModal = (show: boolean) => {
    setState(prev => ({ ...prev, showEditOauthRoleModal: show }))
  }

  const setShowRemoveOauthRoleModal = (show: boolean) => {
    setState(prev => ({ ...prev, showRemoveOauthRoleModal: show }))
  }

  const setEmailEdit = (emailEdit: string | null) => {
    setState(prev => ({ ...prev, emailEdit }))
  }

  const setRoleEdit = (roleEdit: string | null) => {
    setState(prev => ({ ...prev, roleEdit }))
  }

  return {
    _,
    setShowAddOauthRoleModal,
    setShowEditOauthRoleModal,
    setShowRemoveOauthRoleModal,
    setEmailEdit,
    setRoleEdit
  }
}

export {
  OauthRolesProvider,
  useOauthRolesContext,
  useOauthRolesSetState,
}
