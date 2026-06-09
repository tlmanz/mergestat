BEGIN;

DROP TRIGGER IF EXISTS user_oauth_roles_audit_trigger ON mergestat.user_oauth_roles;
DROP FUNCTION IF EXISTS mergestat.user_oauth_roles_audit();

-- Restore the three role functions to their pre-audit bodies (migration 67 / 4).
CREATE OR REPLACE FUNCTION mergestat.user_mgmt_set_user_role(username NAME, role TEXT)
RETURNS SMALLINT AS
$BODY$
DECLARE
BEGIN
    EXECUTE FORMAT('REVOKE mergestat_role_demo FROM %I', username);
    EXECUTE FORMAT('REVOKE mergestat_role_readonly FROM %I', username);
    EXECUTE FORMAT('REVOKE mergestat_role_queries_only FROM %I', username);
    EXECUTE FORMAT('REVOKE mergestat_role_user FROM %I', username);
    EXECUTE FORMAT('REVOKE mergestat_role_admin FROM %I', username);
    EXECUTE FORMAT('ALTER USER %I WITH NOCREATEROLE', username);
    CASE
        WHEN role = 'ADMIN' THEN
            EXECUTE FORMAT('GRANT mergestat_role_admin TO %I', username);
            EXECUTE FORMAT('ALTER USER %I WITH CREATEROLE', username);
        WHEN role = 'USER' THEN
            EXECUTE FORMAT('GRANT mergestat_role_user TO %I', username);
        WHEN role = 'QUERIES_ONLY' THEN
            EXECUTE FORMAT('GRANT mergestat_role_queries_only TO %I', username);
        WHEN role = 'READ_ONLY' THEN
            EXECUTE FORMAT('GRANT mergestat_role_readonly TO %I', username);
        WHEN role = 'DEMO' THEN
            EXECUTE FORMAT('GRANT mergestat_role_demo TO %I', username);
        ELSE
            RAISE EXCEPTION 'Invalid role %', role;
    END CASE;
    RETURN 1;
END;
$BODY$
LANGUAGE plpgsql STRICT VOLATILE;

CREATE OR REPLACE FUNCTION mergestat.user_mgmt_add_user(username NAME, password TEXT, role TEXT)
RETURNS SMALLINT AS
$BODY$
DECLARE
BEGIN
    EXECUTE FORMAT('CREATE USER %I WITH PASSWORD %L', username, password);
    EXECUTE FORMAT('GRANT %I TO mergestat_admin', username);
    EXECUTE FORMAT('GRANT %I TO readaccess', username);
    EXECUTE FORMAT('SELECT mergestat.user_mgmt_set_user_role(%L, %L)', username, role);
    RETURN 1;
END;
$BODY$
LANGUAGE plpgsql STRICT VOLATILE;

CREATE OR REPLACE FUNCTION mergestat.user_mgmt_remove_user(username NAME)
RETURNS SMALLINT AS
$BODY$
DECLARE
BEGIN
    EXECUTE FORMAT('DROP USER IF EXISTS %I', username);
    RETURN 1;
END;
$BODY$
LANGUAGE plpgsql STRICT VOLATILE;

DROP FUNCTION IF EXISTS mergestat.audit_role_change(TEXT, TEXT, TEXT);
DROP TABLE IF EXISTS mergestat.user_mgmt_audit_log;

COMMIT;
