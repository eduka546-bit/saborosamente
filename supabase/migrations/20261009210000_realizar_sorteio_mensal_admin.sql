-- Sorteio mensal dentro do admin. Selecao no banco e transacao atomica.
create or replace function public.realizar_sorteio_mensal(p_ano integer,p_mes integer)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_lead record; v_ano integer;
begin
 if not public.has_role((select auth.uid()),'admin'::public.app_role) then
   raise exception 'Acesso administrativo obrigatorio' using errcode='42501';
 end if;
 v_ano := extract(year from (now() at time zone 'America/Sao_Paulo'))::int;
 if p_ano <> v_ano or p_mes not between 1 and 12 then
   raise exception 'Mes ou ano invalido.';
 end if;
 perform pg_advisory_xact_lock(812925,p_ano * 100 + p_mes);
 if exists(select 1 from public.sorteio_contemplados where ano=p_ano and mes=p_mes) then
   raise exception 'Este mes ja tem vencedor registrado.';
 end if;
 select l.id,l.nome,l.telefone,l.user_id
 into v_lead
 from public.sorteio_leads l
 where l.status='participando'
 and not exists (select 1 from public.sorteio_contemplados c where c.lead_id=l.id and c.ano=p_ano)
 order by gen_random_uuid()
 limit 1;
 if not found then raise exception 'Nao ha participantes elegiveis neste ano.'; end if;
 insert into public.sorteio_contemplados(lead_id,ano,mes) values(v_lead.id,p_ano,p_mes);
 return jsonb_build_object('lead_id',v_lead.id,'nome',v_lead.nome,'telefone',v_lead.telefone,
 'email',(select u.email from auth.users u where u.id=v_lead.user_id),'ano',p_ano,'mes',p_mes);
end;
$$;
revoke all on function public.realizar_sorteio_mensal(integer,integer) from public;
grant execute on function public.realizar_sorteio_mensal(integer,integer) to authenticated;

create or replace function public.consultar_vencedores_sorteio_admin(p_ano integer)
returns table(lead_id uuid,ano integer,mes integer,registrado_em timestamptz,nome text,telefone text,email text)
language plpgsql security definer set search_path to ''
as $$
begin
 if not public.has_role((select auth.uid()),'admin'::public.app_role) then
   raise exception 'Acesso administrativo obrigatorio' using errcode='42501';
 end if;
 return query
 select c.lead_id,c.ano,c.mes,c.registrado_em,l.nome,l.telefone,u.email::text
 from public.sorteio_contemplados c join public.sorteio_leads l on l.id=c.lead_id
 left join auth.users u on u.id=l.user_id
 where c.ano=p_ano order by c.mes desc;
end;
$$;
revoke all on function public.consultar_vencedores_sorteio_admin(integer) from public;
grant execute on function public.consultar_vencedores_sorteio_admin(integer) to authenticated;
