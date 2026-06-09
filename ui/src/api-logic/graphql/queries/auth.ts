import { gql } from '@apollo/client'

const CURRENT_USER = gql`
  query currentUser {
    currentMergeStatUser
  }
`

const IS_ADMIN = gql`
  query isAdmin {
    currentMergeStatUserIsAdmin
  }
`

const GET_DB_CONNECTION = gql`
  query getDatabaseConnection {
    databaseConnection {
      database
      host
      port
      user
    }
  }
`

export { CURRENT_USER, GET_DB_CONNECTION, IS_ADMIN }
