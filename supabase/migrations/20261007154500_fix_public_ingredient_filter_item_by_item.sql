
create or replace function public.ingredientes_publicos_texto(p_ingredientes text)
returns text
language sql
immutable
security invoker
set search_path to ''
as $function$
  select nullif(
    string_agg(trim(item), ', ' order by ord),
    ''
  )
  from unnest(
    regexp_split_to_array(
      coalesce(p_ingredientes, ''),
      '[[:space:]]*[,;][[:space:]]*'
    )
  ) with ordinality as t(item, ord)
  where trim(item) <> ''
    -- Itens explicitamente cadastrados como industrializados/marca
    and lower(item) not like '%industrializ%'
    and lower(item) not like '%industraliad%'
    and lower(item) not like '%marca%'
    -- Demi-glace nunca pode aparecer, mesmo sem anotação
    and lower(item) !~ 'demi[[:space:]-]*glace'
    -- Bases/molhos industrializados conhecidos que podem vir sem anotação
    and lower(trim(item)) !~ '^(extrato de tomate|molho de tomate|molho madeira|molho 4 queijos)([[:space:](]|$)'
    -- Marcas atualmente cadastradas: defesa adicional
    and lower(item) not like '%quero%'
    and lower(item) not like '%qualimax%'
    and lower(item) not like '%elege%'
    and lower(item) not like '%elegê%'
$function$;

revoke all on function public.ingredientes_publicos_texto(text)
  from public, anon, authenticated;
grant execute on function public.ingredientes_publicos_texto(text)
  to service_role;
