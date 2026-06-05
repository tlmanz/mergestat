import { gql } from '@apollo/client'

// Upsert an OAuth role override for an email (used for both "add" and "edit").
const SET_OAUTH_ROLE = gql`
  mutation setOauthRole($email: String!, $role: String!) {
    oauthUserMgmtSetRole(input: { email: $email, role: $role }) {
      clientMutationId
      integer
    }
  }
`

const REMOVE_OAUTH_ROLE = gql`
  mutation removeOauthRole($email: String!) {
    oauthUserMgmtRemove(input: { email: $email }) {
      clientMutationId
      integer
    }
  }
`

type MutationPayload = { clientMutationId?: string | null, integer?: number | null } | null

export type SetOauthRoleMutation = { oauthUserMgmtSetRole?: MutationPayload }
export type RemoveOauthRoleMutation = { oauthUserMgmtRemove?: MutationPayload }

export { REMOVE_OAUTH_ROLE, SET_OAUTH_ROLE }
