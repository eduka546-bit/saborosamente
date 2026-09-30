do $$
declare
  r record;
begin
  for r in
    select n.nspname as schema_name, c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public'
      and c.relkind in ('r','p')
  loop
    execute format(
      'revoke insert, update, delete, truncate, references, trigger on table %I.%I from anon',
      r.schema_name, r.table_name
    );

    execute format(
      'revoke truncate, references, trigger on table %I.%I from authenticated',
      r.schema_name, r.table_name
    );

    if not exists (
      select 1
      from pg_policies p
      where p.schemaname=r.schema_name
        and p.tablename=r.table_name
        and p.cmd='SELECT'
        and (
          p.roles @> array['anon']::name[]
          or p.roles @> array['public']::name[]
        )
    ) then
      execute format(
        'revoke select on table %I.%I from anon',
        r.schema_name, r.table_name
      );
    end if;
  end loop;
end $$;
