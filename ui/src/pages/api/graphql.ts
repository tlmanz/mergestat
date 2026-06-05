import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import httpProxyMiddleware from 'next-http-proxy-middleware'
import { signPgJwt } from 'src/server/pgJwt'

export const config = {
  api: {
    externalResolver: true,
  },
}

const proxy = async (req: NextApiRequest, res: NextApiResponse) => {
  // Password logins set the `jwt` cookie directly (see /api/admin-auth); prefer
  // it when present so that flow is completely unchanged.
  let bearer = req.cookies.jwt

  // OAuth logins (NextAuth) instead carry the resolved PostgreSQL group role on
  // the session token. Mint the same PostGraphile JWT from it on the fly, so the
  // upstream GraphQL server sees an identical `Authorization: Bearer` either way.
  if (!bearer) {
    try {
      const token = await getToken({ req })
      if (token?.pgRole) {
        bearer = await signPgJwt(token.pgRole)
      }
    } catch (error) {
      console.warn(JSON.stringify({
        message: 'failed to derive PostGraphile JWT from OAuth session',
        error: error instanceof Error ? error.message : String(error),
      }))
    }
  }

  return httpProxyMiddleware(req, res, {
    target: process.env.POSTGRAPHILE_API,
    ignorePath: true,
    headers: {
      ...(bearer ? { authorization: `Bearer ${bearer}` } : null),
    },
  })
}

export default proxy
