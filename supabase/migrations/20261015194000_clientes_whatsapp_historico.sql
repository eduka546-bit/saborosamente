-- Cadastro comercial de pedidos WhatsApp, independente de conta de login.
-- Histórico anterior é preservado e não concede acesso a pedidos sem verificação.
create table if not exists public.clientes_whatsapp_historico (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  telefone_normalizado text,
  nome text,
  email text,
  cidade text,
  bairro text,
  rua text,
  numero text,
  complemento text,
  cep text,
  primeiro_pedido_em timestamptz not null,
  ultimo_pedido_em timestamptz not null,
  primeiro_pedido_id uuid not null references public.pedidos(id) on delete restrict,
  ultimo_pedido_id uuid not null references public.pedidos(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clientes_whatsapp_historico_telefone_idx
  on public.clientes_whatsapp_historico(telefone_normalizado)
  where telefone_normalizado is not null;

alter table public.clientes_whatsapp_historico enable row level security;
revoke all on table public.clientes_whatsapp_historico from public, anon;
grant select on table public.clientes_whatsapp_historico to authenticated;

create policy "Somente admins leem historico comercial do WhatsApp"
  on public.clientes_whatsapp_historico for select to authenticated
  using (
    exists (
      select 1 from public.user_roles r
      where r.user_id = (select auth.uid()) and r.role = 'admin'
    )
  );

create or replace function public.registrar_cliente_whatsapp_do_pedido(p public.pedidos)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_digits text;
  v_telefone text;
  v_chave text;
begin
  if coalesce(p.origem,'') <> 'whatsapp' then return; end if;
  v_digits := regexp_replace(coalesce(p.telefone_cliente, ''), '[^0-9]', '', 'g');
  if length(v_digits) in (12,13) and left(v_digits,2)='55' then
    v_digits := substring(v_digits from 3);
  end if;
  if length(v_digits) in (10,11) then v_telefone := v_digits; end if;
  v_chave := case when v_telefone is not null then 'tel:' || v_telefone else 'pedido:' || p.id::text end;

  insert into public.clientes_whatsapp_historico (
    chave, telefone_normalizado, nome, email,
    cidade, bairro, rua, numero, complemento, cep,
    primeiro_pedido_em, ultimo_pedido_em, primeiro_pedido_id, ultimo_pedido_id
  ) values (
    v_chave, v_telefone,
    nullif(btrim(p.nome_cliente),''),
    nullif(lower(btrim(p.email_cliente)),''),
    nullif(btrim(p.endereco_cidade),''),
    nullif(btrim(p.endereco_bairro),''),
    nullif(btrim(p.endereco_rua),''),
    nullif(btrim(p.endereco_numero),''),
    nullif(btrim(p.endereco_complemento),''),
    nullif(btrim(p.endereco_cep),''),
    p.created_at, p.created_at, p.id, p.id
  )
  on conflict (chave) do update
  set
    primeiro_pedido_em = least(public.clientes_whatsapp_historico.primeiro_pedido_em, excluded.primeiro_pedido_em),
    primeiro_pedido_id = case
      when excluded.primeiro_pedido_em < public.clientes_whatsapp_historico.primeiro_pedido_em
      then excluded.primeiro_pedido_id else public.clientes_whatsapp_historico.primeiro_pedido_id end,
    ultimo_pedido_em = greatest(public.clientes_whatsapp_historico.ultimo_pedido_em, excluded.ultimo_pedido_em),
    ultimo_pedido_id = case
      when excluded.ultimo_pedido_em >= public.clientes_whatsapp_historico.ultimo_pedido_em
      then excluded.ultimo_pedido_id else public.clientes_whatsapp_historico.ultimo_pedido_id end,
    telefone_normalizado = coalesce(excluded.telefone_normalizado, public.clientes_whatsapp_historico.telefone_normalizado),
    nome = case when excluded.ultimo_pedido_em >= public.clientes_whatsapp_historico.ultimo_pedido_em then
      coalesce(excluded.nome, public.clientes_whatsapp_historico.nome) else public.clientes_whatsapp_historico.nome end,
    email = coalesce(excluded.email, public.clientes_whatsapp_historico.email),
    cidade = coalesce(excluded.cidade, public.clientes_whatsapp_historico.cidade),
    bairro = coalesce(excluded.bairro, public.clientes_whatsapp_historico.bairro),
    rua = coalesce(excluded.rua, public.clientes_whatsapp_historico.rua),
    numero = coalesce(excluded.numero, public.clientes_whatsapp_historico.numero),
    complemento = coalesce(excluded.complemento, public.clientes_whatsapp_historico.complemento),
    cep = coalesce(excluded.cep, public.clientes_whatsapp_historico.cep),
    updated_at = now();
end;
$$;
revoke all on function public.registrar_cliente_whatsapp_do_pedido(public.pedidos) from public, anon, authenticated;

create or replace function public.registrar_cliente_whatsapp_trigger()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  perform public.registrar_cliente_whatsapp_do_pedido(new);
  return new;
end;
$$;
revoke all on function public.registrar_cliente_whatsapp_trigger() from public, anon, authenticated;

drop trigger if exists trg_registrar_cliente_whatsapp on public.pedidos;
create trigger trg_registrar_cliente_whatsapp
after insert or update of origem,nome_cliente,telefone_cliente,email_cliente,
  endereco_cidade,endereco_bairro,endereco_rua,endereco_numero,
  endereco_complemento,endereco_cep
on public.pedidos for each row
execute function public.registrar_cliente_whatsapp_trigger();

-- Backfill de pedidos reais existentes, sem mexer em valores ou estoque.
select public.registrar_cliente_whatsapp_do_pedido(p)
from public.pedidos p
where p.origem = 'whatsapp'
order by p.created_at asc;
