import NextAuth, { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { isEmailAllowed, resolveMergestatRole } from 'src/server/oauth'

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env

// Only register a provider when its credentials are configured. The login page
// uses NextAuth's getProviders() to decide which OAuth buttons to render, so an
// unconfigured provider simply doesn't appear.
const providers: NextAuthOptions['providers'] = []
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    })
  )
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    // Enforce the optional email-domain allow-list.
    async signIn({ user }) {
      return isEmailAllowed(user.email)
    },
    // Resolve the MergeStat role once, at sign-in, and cache it on the token.
    // (Role changes therefore take effect on the user's next login.)
    async jwt({ token, user }) {
      if (user?.email) {
        const { roleKey, pgRole } = await resolveMergestatRole(user.email)
        token.email = user.email
        token.mergestatRole = roleKey
        token.pgRole = pgRole
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.mergestatRole = token.mergestatRole
      }
      return session
    },
  },
}

export default NextAuth(authOptions)
