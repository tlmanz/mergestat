# OAuth (SSO) login

MergeStat supports optional OAuth single sign-on **in addition to** the built-in
database-credential login. It is implemented with
[NextAuth.js](https://next-auth.js.org/) inside the management UI — no extra
service is required. Google is supported out of the box.

When no OAuth provider is configured, nothing changes: the login screen shows
only the usual database-credential form.

## How it maps to MergeStat roles

MergeStat's authorization model is built on PostgreSQL roles: a password login is
a real PostgreSQL user, and PostGraphile runs each request under that role.

An OAuth identity has no PostgreSQL password of its own, so it is mapped onto one
of the shared group roles (`mergestat_role_admin`, `_user`, `_queries_only`,
`_readonly`, `_demo`). The mapping is **hybrid**:

1. If `mergestat.user_oauth_roles` has a row for the user's email, that role is
   used (admin override).
2. Otherwise the configured default `OAUTH_DEFAULT_ROLE` is used
   (`READ_ONLY` if unset).

The UI's `/api/graphql` proxy mints the same PostGraphile JWT that password login
produces, with the resolved group role as the `role` claim — so authorization
downstream is identical regardless of how the user signed in.

> Role changes take effect on the user's **next login** (the resolved role is
> cached on the session at sign-in).

## Configuration

Set these on the `ui` service (see `docker-compose.yaml`):

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXTAUTH_SECRET` | yes (for OAuth) | Encrypts the NextAuth session. Use a strong random value: `openssl rand -hex 32`. |
| `NEXTAUTH_URL` | yes (for OAuth) | Public base URL of the UI, e.g. `http://localhost:3300`. OAuth callback URLs are derived from this. |
| `GOOGLE_CLIENT_ID` | to enable Google | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | to enable Google | Google OAuth client secret. |
| `OAUTH_DEFAULT_ROLE` | no | Role for users with no override: `ADMIN`, `USER`, `QUERIES_ONLY`, `READ_ONLY` (default), or `DEMO`. |
| `OAUTH_ALLOWED_DOMAINS` | no | Comma-separated email-domain allow-list, e.g. `mergestat.com,example.org`. Empty = allow any email. |

### Setting up the Google OAuth client

1. Google Cloud Console → **APIs & Services → Credentials → Create OAuth client ID → Web application**.
2. Under **Authorized redirect URIs**, add:
   - `http://localhost:3300/api/auth/callback/google` (local), and/or
   - `https://your-domain.com/api/auth/callback/google` (production).
3. Copy the **Client ID** and **Client secret** into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

The callback path is always `{NEXTAUTH_URL}/api/auth/callback/{provider}`.

## Managing role overrides (admin)

Overrides live in `mergestat.user_oauth_roles` and are managed by admins. Two
helper functions are exposed through GraphQL (and usable from the SQL editor):

```sql
-- Promote a user (creates or updates the override; role takes effect next login)
SELECT mergestat.oauth_user_mgmt_set_role('alice@example.com', 'ADMIN');

-- Revert a user to the default OAuth role
SELECT mergestat.oauth_user_mgmt_remove('alice@example.com');

-- List current overrides
SELECT email, role, updated_at FROM mergestat.user_oauth_roles ORDER BY email;
```

Valid roles: `ADMIN`, `USER`, `QUERIES_ONLY`, `READ_ONLY`, `DEMO`.

## Notes & limitations

- For OAuth users, `currentMergeStatUser` (shown in the nav header) reports the
  group role name (e.g. `mergestat_role_readonly`) rather than the email, since
  PostGraphile runs under the shared role.
- After adding the migration to an already-running instance, restart the
  `graphql` service so PostGraphile re-introspects the new functions. A fresh
  `docker-compose up` handles this automatically (migrations run before GraphQL
  starts).
- OAuth and password logins coexist; either can be used. Logging out clears both
  sessions.
