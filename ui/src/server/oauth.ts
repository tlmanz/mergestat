import { Client } from 'pg'

/**
 * MergeStat role keys (as stored in mergestat.user_oauth_roles and surfaced in
 * the user-management UI) mapped to the underlying PostgreSQL group roles that
 * PostGraphile switches into. OAuth users have no PostgreSQL role of their own,
 * so they always map onto one of these shared group roles.
 */
export const MERGESTAT_ROLE = {
  ADMIN: 'mergestat_role_admin',
  USER: 'mergestat_role_user',
  QUERIES_ONLY: 'mergestat_role_queries_only',
  READ_ONLY: 'mergestat_role_readonly',
  DEMO: 'mergestat_role_demo',
} as const

export type MergestatRoleKey = keyof typeof MERGESTAT_ROLE

const isRoleKey = (value: string | undefined | null): value is MergestatRoleKey =>
  !!value && Object.prototype.hasOwnProperty.call(MERGESTAT_ROLE, value)

/** The role assigned to an OAuth user with no explicit override. */
const defaultRoleKey = (): MergestatRoleKey => {
  const fromEnv = process.env.OAUTH_DEFAULT_ROLE
  return isRoleKey(fromEnv) ? fromEnv : 'READ_ONLY'
}

/**
 * Optional allow-list of email domains permitted to sign in via OAuth.
 * Comma-separated, e.g. "mergestat.com,example.org". Empty/unset allows all.
 */
export const isEmailAllowed = (email?: string | null): boolean => {
  if (!email) return false
  const allowed = (process.env.OAUTH_ALLOWED_DOMAINS || '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
  if (allowed.length === 0) return true
  const domain = email.split('@')[1]?.toLowerCase()
  return !!domain && allowed.includes(domain)
}

/** Look up an admin-configured role override for an email, if any. */
const lookupOverride = async (email: string): Promise<MergestatRoleKey | null> => {
  const { POSTGRES_CONNECTION } = process.env
  if (!POSTGRES_CONNECTION) return null

  const client = new Client({
    connectionString: POSTGRES_CONNECTION,
    connectionTimeoutMillis: 3000,
  })

  try {
    await client.connect()
    const result = await client.query(
      'SELECT role FROM mergestat.user_oauth_roles WHERE email = $1',
      [email.toLowerCase()]
    )
    const role = result.rows[0]?.role as string | undefined
    return isRoleKey(role) ? role : null
  } catch (error) {
    // A missing override table or a transient DB error should not block login;
    // fall back to the default role rather than failing the OAuth callback.
    console.warn(JSON.stringify({
      message: 'oauth role lookup failed, falling back to default role',
      error: error instanceof Error ? error.message : String(error),
    }))
    return null
  } finally {
    await client.end().catch(() => undefined)
  }
}

/**
 * Resolve the MergeStat role for an authenticated OAuth email: an admin
 * override if present, otherwise the configured default (READ_ONLY if unset).
 * Returns both the role key (for display/audit) and the PostgreSQL group role
 * (for the JWT `role` claim).
 */
export const resolveMergestatRole = async (
  email: string
): Promise<{ roleKey: MergestatRoleKey; pgRole: string }> => {
  const roleKey = (await lookupOverride(email)) ?? defaultRoleKey()
  return { roleKey, pgRole: MERGESTAT_ROLE[roleKey] }
}
