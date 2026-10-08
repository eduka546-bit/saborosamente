
create or replace function public.combo_sabores_publicos(p_combo_id uuid)
returns setof jsonb
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select jsonb_build_object(
    'id', p.id,
    'nome', p.nome,
    'imagem_url', p.imagem_url,
    'estoque_200g', p.estoque_200g,
    'estoque_300g', p.estoque_300g,
    'estoque_400g', p.estoque_400g,
    'controle_estoque', p.controle_estoque,
    'ativo', p.ativo,
    'visivel_online', p.visivel_online
  )
  from public.combo_sabores cs
  join public.produtos combo on combo.id = cs.combo_id
  join public.produtos p on p.id = cs.produto_id
  where cs.combo_id = p_combo_id
    and cs.ativo = true
    and combo.ativo = true
    and combo.visivel_online = true
    and p.ativo = true
    and p.visivel_online = true
  order by cs.ordem nulls last, p.nome;
$function$;

revoke all on function public.combo_sabores_publicos(uuid)
  from public, anon, authenticated;
grant execute on function public.combo_sabores_publicos(uuid)
  to anon, authenticated, service_role;
