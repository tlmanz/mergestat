import 'next-auth'
import 'next-auth/jwt'

// Augment NextAuth's JWT/session with the resolved MergeStat role so the
// /api/graphql proxy can mint a PostGraphile token from the session.
declare module 'next-auth/jwt' {
  interface JWT {
    /** PostgreSQL group role for the request (e.g. mergestat_role_readonly). */
    pgRole?: string
    /** MergeStat role key (e.g. READ_ONLY) for display/audit. */
    mergestatRole?: string
    email?: string | null
  }
}

declare module 'next-auth' {
  interface Session {
    user?: {
      name?: string | null
      email?: string | null
      image?: string | null
      mergestatRole?: string
    }
  }
}
