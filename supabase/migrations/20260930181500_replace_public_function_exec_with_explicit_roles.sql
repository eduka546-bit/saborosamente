do $$
declare
  r record;
  sig text;
  allow_anon boolean;
  allow_auth boolean;
  allow_service boolean;
begin
  for r in
    select p.oid, n.nspname, p.proname,
           pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef
  loop
    allow_anon := has_function_privilege('anon', r.oid, 'EXECUTE');
    allow_auth := has_function_privilege('authenticated', r.oid, 'EXECUTE');
    allow_service := has_function_privilege('service_role', r.oid, 'EXECUTE');

    sig := format('%I.%I(%s)', r.nspname, r.proname, r.args);

    execute 'revoke execute on function ' || sig || ' from public, anon, authenticated, service_role';

    if allow_anon then
      execute 'grant execute on function ' || sig || ' to anon';
    end if;
    if allow_auth then
      execute 'grant execute on function ' || sig || ' to authenticated';
    end if;
    if allow_service then
      execute 'grant execute on function ' || sig || ' to service_role';
    end if;
  end loop;
end $$;
