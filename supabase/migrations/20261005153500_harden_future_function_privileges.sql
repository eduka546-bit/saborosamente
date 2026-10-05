-- Secure-by-default function privileges for new functions created by postgres.
-- Existing RPC permissions are intentionally preserved.
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

alter default privileges for role postgres in schema public
  grant execute on functions to service_role;
