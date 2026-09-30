do $$
declare
  r record;
  op text;
  has_policy boolean;
begin
  for r in
    select n.nspname as schema_name, c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public'
      and c.relkind in ('r','p')
  loop
    foreach op in array array['SELECT','INSERT','UPDATE','DELETE']
    loop
      select exists (
        select 1
        from pg_policies p
        where p.schemaname=r.schema_name
          and p.tablename=r.table_name
          and p.cmd in (op,'ALL')
          and (
            p.roles @> array['authenticated']::name[]
            or p.roles @> array['public']::name[]
          )
      ) into has_policy;

      if not has_policy then
        execute format(
          'revoke %s on table %I.%I from authenticated',
          op, r.schema_name, r.table_name
        );
      end if;
    end loop;
  end loop;
end $$;
