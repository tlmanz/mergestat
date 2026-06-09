BEGIN;

-- Audit trail of user/role management actions: who changed whose role/account and when.
CREATE TABLE IF NOT EXISTS mergestat.user_mgmt_audit_log (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor      TEXT NOT NULL,
    action     TEXT NOT NULL,
    target     TEXT NOT NULL,
    detail     TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE mergestat.user_mgmt_audit_log IS
    'Audit trail of user/role management actions (DB users and OAuth role overrides). Append-only: admins can read and insert but not modify/delete.';

-- Single helper all instrumented paths write through. Records the acting DB role.
CREATE OR REPLACE FUNCTION mergestat.audit_role_change(_action TEXT, _target TEXT, _detail TEXT)
RETURNS void AS
$BODY$
    INSERT INTO mergestat.user_mgmt_audit_log (actor, action, target, detail)
    VALUES (current_user, _action, _target, _detail);
$BODY$
LANGUAGE sql VOLATILE;

-- OAuth role overrides live in a table, so a trigger captures every change with no
-- need to rewrite the oauth_user_mgmt_* functions.
CREATE OR REPLACE FUNCTION mergestat.user_oauth_roles_audit() RETURNS trigger AS
$BODY$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        PERFORM mergestat.audit_role_change('REMOVE_OAUTH_ROLE', OLD.email, OLD.role);
        RETURN OLD;
    ELSE
        PERFORM mergestat.audit_role_change(
            CASE WHEN TG_OP = 'INSERT' THEN 'SET_OAUTH_ROLE' ELSE 'UPDATE_OAUTH_ROLE' END,
            NEW.email, NEW.role);
        RETURN NEW;
    END IF;
END;
$BODY$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_oauth_roles_audit_trigger ON mergestat.user_oauth_roles;
CREATE TRIGGER user_oauth_roles_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON mergestat.user_oauth_roles
    FOR EACH ROW EXECUTE FUNCTION mergestat.user_oauth_roles_audit();

-- DB-user role/account changes happen inside SECURITY-less plpgsql functions (CREATE USER /
-- GRANT are not table ops, so they can't be trapped by a trigger). Re-declare the three
-- that change role/account membership, adding an audit call. Bodies match migration 67 / 4.
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
    PERFORM mergestat.audit_role_change('SET_ROLE', username, role);
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
    PERFORM mergestat.audit_role_change('ADD_USER', username, role);
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
    PERFORM mergestat.audit_role_change('REMOVE_USER', username, NULL);
    RETURN 1;
END;
$BODY$
LANGUAGE plpgsql STRICT VOLATILE;

-- Only admins read/append the audit log (append-only: no UPDATE/DELETE).
GRANT SELECT, INSERT ON TABLE mergestat.user_mgmt_audit_log TO mergestat_role_admin;
GRANT EXECUTE ON FUNCTION mergestat.audit_role_change(TEXT, TEXT, TEXT) TO mergestat_role_admin;

COMMIT;
