import { useQuery } from '@apollo/client'
import { IS_ADMIN } from 'src/api-logic/graphql/queries/auth'

type IsAdminQuery = { currentMergeStatUserIsAdmin?: boolean | null }

/**
 * Whether the current user is a MergeStat admin (member of mergestat_role_admin).
 * Backed by the currentMergeStatUserIsAdmin GraphQL function. While loading,
 * `isAdmin` is false, so callers should also consider `loading` before redirecting.
 */
const useIsAdmin = () => {
  const { loading, data } = useQuery<IsAdminQuery>(IS_ADMIN, { fetchPolicy: 'no-cache' })
  return { loading, isAdmin: !!data?.currentMergeStatUserIsAdmin }
}

export default useIsAdmin
