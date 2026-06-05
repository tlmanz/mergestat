import { gql } from '@apollo/client'

const LIST_OAUTH_ROLES = gql`
  query getOauthRoles($search: String) {
    userOauthRoles(filter: { email: { includesInsensitive: $search } }) {
      nodes {
        email
        role
        updatedAt
      }
    }
  }
`

export { LIST_OAUTH_ROLES }
