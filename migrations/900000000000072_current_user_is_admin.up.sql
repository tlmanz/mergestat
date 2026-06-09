BEGIN;

-- Returns whether the current request's role is a MergeStat admin. Works for both
-- password logins (a login role that is a member of mergestat_role_admin) and OAuth
-- logins (whose JWT role IS mergestat_role_admin). Exposed via GraphQL as
-- `currentMergeStatUserIsAdmin`, mirroring current_merge_stat_user().
CREATE OR REPLACE FUNCTION current_merge_stat_user_is_admin() RETURNS boolean AS $$
    SELECT pg_has_role(current_user, 'mergestat_role_admin', 'MEMBER')
$$ LANGUAGE sql STABLE;

COMMIT;
