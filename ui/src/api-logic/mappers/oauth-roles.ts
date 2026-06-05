/**
 * Types and mapper for OAuth role overrides (mergestat.user_oauth_roles).
 *
 * These are hand-written rather than codegen'd because the corresponding
 * GraphQL types are generated from a live PostGraphile schema (npm run codegen).
 * Running codegen will produce equivalent generated types; until then these keep
 * the feature self-contained and type-safe.
 */
export type OAuthRoleNode = { email: string, role: string, updatedAt?: string | null }

export type GetOauthRolesQuery = {
  userOauthRoles?: { nodes: Array<OAuthRoleNode> } | null
}

/** `role` is the MergeStat role key, e.g. 'ADMIN' | 'READ_ONLY'. */
export type OAuthRoleData = { email: string, role: string }

const mapToOauthRoleData = (data?: GetOauthRolesQuery): Array<OAuthRoleData> =>
  data?.userOauthRoles?.nodes.map(({ email, role }) => ({ email, role })) ?? []

export { mapToOauthRoleData }
