-- Auditoria de segurança: restringe dados internos expostos no schema público.

revoke all on table public.push_subscriptions from anon;
grant select, insert, update, delete on table public.push_subscriptions to authenticated;

drop policy if exists "push_insert_all" on public.push_subscriptions;
drop policy if exists "push_update_all" on public.push_subscriptions;
drop policy if exists "push_delete_all" on public.push_subscriptions;
drop policy if exists "push_select_all" on public.push_subscriptions;
drop policy if exists "push_admin_all" on public.push_subscriptions;

create policy "push_admin_all"
on public.push_subscriptions
for all
to authenticated
using (public.has_role((select auth.uid()), 'admin'::public.app_role))
with check (public.has_role((select auth.uid()), 'admin'::public.app_role));

revoke select on table public.embalagens from anon;
drop policy if exists "embalagens_read" on public.embalagens;

revoke select on table public.cupons from anon;
drop policy if exists "public_read_active_cupons" on public.cupons;

create or replace function public.validar_cupom_publico(p_codigo text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public','pg_temp'
as $$
declare
  v_codigo text := upper(trim(coalesce(p_codigo,'')));
  v_result jsonb;
begin
  if v_codigo = '' or length(v_codigo) > 80 or v_codigo !~ '^[A-Z0-9_-]+$' then
    return null;
  end if;

  select jsonb_build_object(
    'codigo', c.codigo,
    'tipo', c.tipo,
    'valor', c.valor,
    'ativo', c.ativo,
    'validade', c.validade,
    'regra', c.regra,
    'uso', c.uso,
    'max_uso', c.max_uso,
    'apenas_primeira_compra', c.apenas_primeira_compra,
    'substitui_desconto_progressivo', c.substitui_desconto_progressivo,
    'excluir_combo_pronto', c.excluir_combo_pronto
  )
  into v_result
  from public.cupons c
  where upper(c.codigo)=v_codigo
    and c.ativo=true
  limit 1;

  return v_result;
end;
$$;

revoke all on function public.validar_cupom_publico(text) from public;
grant execute on function public.validar_cupom_publico(text) to anon, authenticated, service_role;

drop policy if exists "Produtos visíveis para todos" on public.produtos;
drop policy if exists "produtos_public_read" on public.produtos;
drop policy if exists "Admins gerenciam produtos" on public.produtos;
revoke select on table public.produtos from anon;

create or replace function public.produtos_publicos()
returns setof jsonb
language sql
stable
security definer
set search_path to 'public','pg_temp'
as $$
  select jsonb_build_object(
    'id', p.id,
    'nome', p.nome,
    'descricao', p.descricao,
    'ingredientes', p.ingredientes,
    'preco', p.preco,
    'peso', p.peso,
    'categoria', p.categoria,
    'imagem_url', p.imagem_url,
    'destaque', p.destaque,
    'categoria_id', p.categoria_id,
    'calorias', p.calorias,
    'status', p.status,
    'informacao_nutricional', p.informacao_nutricional,
    'controle_estoque', p.controle_estoque,
    'estoque_atual', p.estoque_atual,
    'preco_promocional', p.preco_promocional,
    'is_destaque', p.is_destaque,
    'is_novidade', p.is_novidade,
    'frete_gratis', p.frete_gratis,
    'bloquear_cupom', p.bloquear_cupom,
    'preco_300g', p.preco_300g,
    'preco_400g', p.preco_400g,
    'tabela_nutricional', p.tabela_nutricional,
    'tabela_nutricional_300g', p.tabela_nutricional_300g,
    'tabela_nutricional_400g', p.tabela_nutricional_400g,
    'imagens', p.imagens,
    'ativo', p.ativo,
    'ordem', p.ordem,
    'estoque', p.estoque,
    'info_nutricional', p.info_nutricional,
    'restricoes', p.restricoes,
    'imagem_200g', p.imagem_200g,
    'imagem_300g', p.imagem_300g,
    'imagem_400g', p.imagem_400g,
    'rating', p.rating,
    'sem_gluten', p.sem_gluten,
    'sem_lactose', p.sem_lactose,
    'estoque_200g', p.estoque_200g,
    'estoque_300g', p.estoque_300g,
    'estoque_400g', p.estoque_400g,
    'visivel_online', p.visivel_online,
    'tipo_produto', p.tipo_produto,
    'tabela_nutricional_200g', p.tabela_nutricional_200g,
    'restricoes_200g', p.restricoes_200g,
    'restricoes_300g', p.restricoes_300g,
    'restricoes_400g', p.restricoes_400g,
    'subgrupo', p.subgrupo,
    'proteina', p.proteina,
    'observacao_cardapio', p.observacao_cardapio,
    'categorias', case when c.id is null then null else jsonb_build_object(
      'nome', c.nome,
      'ordem_filtro', c.ordem_filtro
    ) end
  )
  from public.produtos p
  left join public.categorias c on c.id=p.categoria_id
  where p.ativo=true and p.visivel_online=true
  order by p.categoria_id, p.ordem, p.nome;
$$;

revoke all on function public.produtos_publicos() from public;
grant execute on function public.produtos_publicos() to anon, authenticated, service_role;

create or replace function public.produtos_resumo(p_ids uuid[])
returns setof jsonb
language plpgsql
stable
security definer
set search_path to 'public','pg_temp'
as $$
begin
  if p_ids is null or cardinality(p_ids)=0 then
    return;
  end if;
  if cardinality(p_ids) > 100 then
    raise exception 'Muitos produtos solicitados' using errcode='22023';
  end if;

  return query
  select jsonb_build_object(
    'id', p.id,
    'nome', p.nome,
    'imagem_url', p.imagem_url,
    'preco', p.preco,
    'preco_300g', p.preco_300g,
    'preco_400g', p.preco_400g,
    'ativo', p.ativo,
    'visivel_online', p.visivel_online
  )
  from public.produtos p
  where p.id = any(p_ids);
end;
$$;

revoke all on function public.produtos_resumo(uuid[]) from public;
grant execute on function public.produtos_resumo(uuid[]) to authenticated, service_role;

create or replace function public.admin_produtos_completos()
returns setof jsonb
language plpgsql
stable
security definer
set search_path to 'public','pg_temp'
as $$
begin
  if not public.usuario_tem_role(array['admin']) then
    raise exception 'Acesso não autorizado' using errcode='42501';
  end if;

  return query
  select to_jsonb(p) || jsonb_build_object(
    'categorias',
    case when c.id is null then null else jsonb_build_object('nome',c.nome) end
  )
  from public.produtos p
  left join public.categorias c on c.id=p.categoria_id
  order by p.ordem, p.nome;
end;
$$;

revoke all on function public.admin_produtos_completos() from public;
grant execute on function public.admin_produtos_completos() to authenticated, service_role;
