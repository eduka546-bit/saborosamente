create or replace function public.reverter_conclusao_producao_cozinha(p_producao_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.cozinha_producoes%rowtype;
  c text;
  saldo integer;
begin
  if not (
    public.has_role((select auth.uid()), 'admin'::public.app_role)
    or public.has_role((select auth.uid()), 'cozinha'::public.app_role)
  ) then
    raise exception 'Acesso não autorizado' using errcode = '42501';
  end if;

  select * into v from public.cozinha_producoes where id = p_producao_id for update;
  if not found then raise exception 'Produção não encontrada'; end if;
  if v.status <> 'concluida' then return; end if;

  c := case v.gramatura
    when '200' then 'estoque_200g'
    when '300' then 'estoque_300g'
    when '400' then 'estoque_400g'
    else null
  end;
  if c is null then raise exception 'Tamanho de produção inválido'; end if;

  execute format('select %I from public.cozinha_estoque_marmitas where produto_id = $1 for update', c)
    into saldo using v.produto_id;
  if saldo is null or saldo < v.quantidade_planejada then
    raise exception 'Não é possível voltar para pendente: parte deste lote já foi transferida para a loja.';
  end if;

  execute format('update public.cozinha_estoque_marmitas set %I = %I - $1, updated_at = now(), updated_by = $2 where produto_id = $3', c, c)
    using v.quantidade_planejada, (select auth.uid()), v.produto_id;
  update public.cozinha_producoes
    set status = 'planejada', quantidade_produzida = null, updated_at = now()
    where id = p_producao_id;
end;
$$;

revoke all on function public.reverter_conclusao_producao_cozinha(uuid) from public, anon;
grant execute on function public.reverter_conclusao_producao_cozinha(uuid) to authenticated, service_role;
notify pgrst, 'reload schema';
