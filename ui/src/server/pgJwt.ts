import * as jose from 'jose'

/**
 * Mint a PostGraphile-compatible JWT for the given PostgreSQL role.
 *
 * This is the exact token shape PostGraphile expects: it is signed with the
 * shared JWT_SECRET (HS256) and carries a `role` claim that PostGraphile uses
 * to `SET ROLE` for the request. Both the password-login flow (admin-auth) and
 * the OAuth flow (the /api/graphql proxy) produce this same token, so authz
 * downstream is identical regardless of how the user signed in.
 */
export const signPgJwt = async (role: string): Promise<string> => {
  const { JWT_SECRET } = process.env
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set')
  }

  return new jose.SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('mergestat:mergestat')
    .setAudience('postgraphile')
    .setExpirationTime('5h')
    .sign(new TextEncoder().encode(JWT_SECRET))
}
