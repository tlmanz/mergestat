BEGIN;

DROP FUNCTION IF EXISTS mergestat.oauth_user_mgmt_remove(TEXT);
DROP FUNCTION IF EXISTS mergestat.oauth_user_mgmt_set_role(TEXT, TEXT);
DROP TABLE IF EXISTS mergestat.user_oauth_roles;

COMMIT;
