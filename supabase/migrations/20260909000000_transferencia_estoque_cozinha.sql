create table if not exists public.cozinha_estoque_marmitas (
  produto_id uuid primary key references public.produtos(id) on delete cascade,
  estoque_200g integer not null default 0 check (estoque_200g >= 0),
  estoque_300g integer not null default 0 check (estoque_300g >= 0),
  estoque_400g integer not null default 0 check (estoque_400g >= 0),
  updated_at timestamptz not null default now(), updated_by uuid references auth.users(id)
);
create table if not exists public.cozinha_transferencias_estoque (
  id uuid primary key default gen_random_uuid(), produto_id uuid not null references public.produtos(id) on delete restrict,
  tamanho text not null check (tamanho in ('200','300','400')), quantidade integer not null check (quantidade > 0),
  transferido_por uuid references auth.users(id), created_at timestamptz not null default now()
);
alter table public.cozinha_estoque_marmitas enable row level security;
alter table public.cozinha_transferencias_estoque enable row level security;
drop policy if exists "cozinha consulta estoque de marmitas" on public.cozinha_estoque_marmitas;
create policy "cozinha consulta estoque de marmitas" on public.cozinha_estoque_marmitas for select to authenticated using (public.has_role((select auth.uid()), 'admin'::public.app_role) or public.has_role((select auth.uid()), 'cozinha'::public.app_role));
drop policy if exists "cozinha consulta transferencias" on public.cozinha_transferencias_estoque;
create policy "cozinha consulta transferencias" on public.cozinha_transferencias_estoque for select to authenticated using (public.has_role((select auth.uid()), 'admin'::public.app_role) or public.has_role((select auth.uid()), 'cozinha'::public.app_role));

create or replace function public.concluir_producao_cozinha(p_producao_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare v public.cozinha_producoes%rowtype; c text;
begin
  if not (public.has_role((select auth.uid()), 'admin'::public.app_role) or public.has_role((select auth.uid()), 'cozinha'::public.app_role)) then raise exception 'Acesso não autorizado' using errcode = '42501'; end if;
  select * into v from public.cozinha_producoes where id=p_producao_id for update;
  if not found then raise exception 'Produção não encontrada'; end if;
  if v.status='concluida' then return; end if;
  c:=case v.gramatura when '200' then 'estoque_200g' when '300' then 'estoque_300g' when '400' then 'estoque_400g' else null end;
  if c is null then raise exception 'Tamanho de produção inválido'; end if;
  insert into public.cozinha_estoque_marmitas(produto_id,updated_by) values(v.produto_id,(select auth.uid())) on conflict(produto_id) do nothing;
  execute format('update public.cozinha_estoque_marmitas set %I=%I+$1,updated_at=now(),updated_by=$2 where produto_id=$3',c,c) using v.quantidade_planejada,(select auth.uid()),v.produto_id;
  update public.cozinha_producoes set status='concluida',quantidade_produzida=quantidade_planejada,updated_at=now() where id=p_producao_id;
end; $$;

create or replace function public.transferir_cozinha_para_loja(p_produto_id uuid,p_tamanho text,p_quantidade integer) returns void language plpgsql security definer set search_path = '' as $$
declare saldo integer; c text;
begin
  if not (public.has_role((select auth.uid()), 'admin'::public.app_role) or public.has_role((select auth.uid()), 'cozinha'::public.app_role)) then raise exception 'Acesso não autorizado' using errcode = '42501'; end if;
  if p_quantidade is null or p_quantidade<=0 then raise exception 'Informe uma quantidade válida'; end if;
  c:=case p_tamanho when '200' then 'estoque_200g' when '300' then 'estoque_300g' when '400' then 'estoque_400g' else null end;
  if c is null then raise exception 'Tamanho inválido'; end if;
  execute format('select %I from public.cozinha_estoque_marmitas where produto_id=$1 for update',c) into saldo using p_produto_id;
  if saldo is null then raise exception 'Não há saldo deste produto na cozinha'; end if;
  if saldo<p_quantidade then raise exception 'Quantidade maior que o saldo da cozinha'; end if;
  execute format('update public.cozinha_estoque_marmitas set %I=%I-$1,updated_at=now(),updated_by=$2 where produto_id=$3',c,c) using p_quantidade,(select auth.uid()),p_produto_id;
  execute format('update public.produtos set %I=%I+$1 where id=$2',c,c) using p_quantidade,p_produto_id;
  insert into public.cozinha_transferencias_estoque(produto_id,tamanho,quantidade,transferido_por) values(p_produto_id,p_tamanho,p_quantidade,(select auth.uid()));
end; $$;
revoke all on function public.concluir_producao_cozinha(uuid) from public,anon;
grant execute on function public.concluir_producao_cozinha(uuid) to authenticated,service_role;
revoke all on function public.transferir_cozinha_para_loja(uuid,text,integer) from public,anon;
grant execute on function public.transferir_cozinha_para_loja(uuid,text,integer) to authenticated,service_role;
notify pgrst, 'reload schema';
