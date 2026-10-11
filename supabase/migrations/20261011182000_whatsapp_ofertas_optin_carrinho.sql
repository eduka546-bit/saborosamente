-- Cadastro separado e voluntário de ofertas por WhatsApp, sem inscrição automática no sorteio.
create table if not exists public.whatsapp_ofertas_optins (
  telefone text primary key check (telefone ~ '^[0-9]{10,11}$'),
  nome text,
  session_id text not null,
  consentimento boolean not null default true,
  consentido_em timestamptz,
  revogado_em timestamptz,
  origem text not null default 'carrinho' check (origem in ('carrinho')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.whatsapp_ofertas_optins enable row level security;
revoke all on public.whatsapp_ofertas_optins from anon, authenticated;
comment on table public.whatsapp_ofertas_optins is
  'WhatsApp para cupons/ofertas mediante autorização individual e voluntária; não autoriza recuperação de carrinho e não inscreve no sorteio.';

create or replace function public.registrar_whatsapp_ofertas_carrinho(
  p_telefone text,
  p_session_id text,
  p_nome text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_telefone text := regexp_replace(coalesce(p_telefone,''), '[^0-9]', '', 'g');
  v_session text := btrim(coalesce(p_session_id,''));
  v_nome text := nullif(left(btrim(coalesce(p_nome,'')),80),'');
begin
  if left(v_telefone,2) = '55' and length(v_telefone) in (12,13) then
    v_telefone := substr(v_telefone,3);
  end if;
  if v_telefone !~ '^[0-9]{10,11}$' then
    raise exception 'Informe WhatsApp válido com DDD.';
  end if;
  if length(v_session) < 16 or length(v_session) > 100 then
    raise exception 'Sessão inválida.';
  end if;
  insert into public.whatsapp_ofertas_optins
    (telefone,nome,session_id,consentimento,consentido_em,revogado_em,origem)
  values (v_telefone,v_nome,v_session,true,now(),null,'carrinho')
  on conflict (telefone) do update set
    nome = coalesce(excluded.nome,whatsapp_ofertas_optins.nome),
    session_id = excluded.session_id,
    consentimento = true,
    consentido_em = now(),
    revogado_em = null,
    atualizado_em = now();
  return 'registrado';
end;
$$;

create or replace function public.revogar_whatsapp_ofertas_carrinho(
  p_telefone text,
  p_session_id text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_telefone text := regexp_replace(coalesce(p_telefone,''), '[^0-9]', '', 'g');
begin
  if left(v_telefone,2) = '55' and length(v_telefone) in (12,13) then
    v_telefone := substr(v_telefone,3);
  end if;
  update public.whatsapp_ofertas_optins
    set consentimento=false,revogado_em=now(),atualizado_em=now()
  where telefone=v_telefone
    and session_id=btrim(coalesce(p_session_id,''));
  return 'registrado';
end;
$$;

revoke all on function public.registrar_whatsapp_ofertas_carrinho(text,text,text) from public;
revoke all on function public.revogar_whatsapp_ofertas_carrinho(text,text) from public;
grant execute on function public.registrar_whatsapp_ofertas_carrinho(text,text,text) to anon, authenticated;
grant execute on function public.revogar_whatsapp_ofertas_carrinho(text,text) to anon, authenticated;
