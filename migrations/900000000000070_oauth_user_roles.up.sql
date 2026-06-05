BEGIN;

-- OAuth (SSO) login support.
--
-- Unlike password logins (where every MergeStat user is a real PostgreSQL role),
-- an OAuth-authenticated identity has no PostgreSQL password/role of its own.
-- Instead, the UI maps an authenticated OAuth email onto one of the shared
-- mergestat_role_* group roles. By default a configurable role is used
-- (OAUTH_DEFAULT_ROLE in the UI, READ_ONLY if unset); this table lets an admin
-- override the role for specific users ("hybrid" mapping).
CREATE TABLE IF NOT EXISTS mergestat.user_oauth_roles (
    email      TEXT PRIMARY KEY,
    role       TEXT NOT NULL CHECK (role IN ('ADMIN', 'USER', 'QUERIES_ONLY', 'READ_ONLY', 'DEMO')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE mergestat.user_oauth_roles IS
    'Per-user MergeStat role overrides for OAuth (SSO) logins, keyed by (lower-cased) email. Maps an authenticated OAuth identity to a MergeStat role; the UI translates the role key to a mergestat_role_* PostgreSQL group role for the request.';

-- Upsert an override. Emails are normalised to lower case to match the UI lookup.
CREATE OR REPLACE FUNCTION mergestat.oauth_user_mgmt_set_role(email TEXT, role TEXT)
RETURNS SMALLINT AS
$BODY$
    INSERT INTO mergestat.user_oauth_roles AS r (email, role)
    VALUES (lower(oauth_user_mgmt_set_role.email), oauth_user_mgmt_set_role.role)
    ON CONFLICT (email) DO UPDATE
        SET role = excluded.role,
            updated_at = now();
    SELECT 1::SMALLINT;
$BODY$
LANGUAGE sql VOLATILE STRICT;

-- Remove an override, reverting the user to the default OAuth role on next login.
CREATE OR REPLACE FUNCTION mergestat.oauth_user_mgmt_remove(email TEXT)
RETURNS SMALLINT AS
$BODY$
    DELETE FROM mergestat.user_oauth_roles WHERE email = lower(oauth_user_mgmt_remove.email);
    SELECT 1::SMALLINT;
$BODY$
LANGUAGE sql VOLATILE STRICT;

-- Only admins may view or manage OAuth role overrides.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE mergestat.user_oauth_roles TO mergestat_role_admin;
GRANT EXECUTE ON FUNCTION mergestat.oauth_user_mgmt_set_role(TEXT, TEXT) TO mergestat_role_admin;
GRANT EXECUTE ON FUNCTION mergestat.oauth_user_mgmt_remove(TEXT) TO mergestat_role_admin;

COMMIT;
