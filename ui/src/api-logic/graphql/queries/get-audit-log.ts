import { gql } from '@apollo/client'

const GET_AUDIT_LOG = gql`
  query getAuditLog($first: Int) {
    userMgmtAuditLogs(orderBy: CREATED_AT_DESC, first: $first) {
      nodes {
        id
        actor
        action
        target
        detail
        createdAt
      }
    }
  }
`

export { GET_AUDIT_LOG }
