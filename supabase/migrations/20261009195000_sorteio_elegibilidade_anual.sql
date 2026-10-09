-- Um contemplado por mes; vencedor excluido so no ano da premiacao.
create table if not exists public.sorteio_contemplados (
 id uuid primary key default gen_random_uuid(),
 lead_id uuid not null references public.sorteio_leads(id) on delete restrict,
 ano integer not null check (ano between 2026 and 2200),
 mes integer not null check (mes between 1 and 12),
 registrado_em timestamptz not null default now(),
 unique(ano,mes),
 unique(lead_id,ano)
);
alter table public.sorteio_contemplados enable row level security;
create policy "Admin le contemplados" on public.sorteio_contemplados for select to authenticated
 using (public.has_role((select auth.uid()),'admin'::public.app_role));
-- Migra qualquer contemplado antigo para o ano e mes da data original, caso exista.
insert into public.sorteio_contemplados(lead_id,ano,mes,registrado_em)
select id, extract(year from (contemplado_em at time zone 'America/Sao_Paulo'))::int,
 extract(month from (contemplado_em at time zone 'America/Sao_Paulo'))::int, contemplado_em
from public.sorteio_leads where status='contemplado' and contemplado_em is not null
on conflict do nothing;
update public.sorteio_leads set status='participando',contemplado_em=null
 where status='contemplado';

create or replace function public.registrar_contemplado_sorteio(p_lead_id uuid, p_ano integer, p_mes integer)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_id uuid; v_nome text; v_ano_atual int;
begin
 if not public.has_role((select auth.uid()),'admin'::public.app_role) then
   raise exception 'Apenas administradores podem registrar contemplados' using errcode='42501';
 end if;
 v_ano_atual:=extract(year from (now() at time zone 'America/Sao_Paulo'))::int;
 if p_ano <> v_ano_atual or p_mes not between 1 and 12 then
   raise exception 'Registre contemplados apenas no ano vigente e em meses validos.';
 end if;
 select id,nome into v_id,v_nome from public.sorteio_leads
  where id=p_lead_id and status='participando' for update;
 if v_id is null then raise exception 'Participante nao esta elegivel.'; end if;
 if exists(select 1 from public.sorteio_contemplados where lead_id=p_lead_id and ano=p_ano) then
    raise exception 'Este participante ja foi contemplado neste ano.';
 end if;
 if exists(select 1 from public.sorteio_contemplados where ano=p_ano and mes=p_mes) then
    raise exception 'Este mes ja possui um contemplado.';
 end if;
 insert into public.sorteio_contemplados(lead_id,ano,mes) values(p_lead_id,p_ano,p_mes);
 return jsonb_build_object('nome',v_nome,'ano',p_ano,'mes',p_mes);
end;
$$;
revoke all on function public.registrar_contemplado_sorteio(uuid,integer,integer) from public;
grant execute on function public.registrar_contemplado_sorteio(uuid,integer,integer) to authenticated;
