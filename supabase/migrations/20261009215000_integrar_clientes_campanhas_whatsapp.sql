-- Ligacao automatica do nome de clientes ao painel WhatsApp.
create or replace function public.sincronizar_nome_whatsapp_cliente()
returns trigger language plpgsql security definer set search_path to ''
as $$
declare tel text; nome_cliente text;
begin
 tel:=regexp_replace(coalesce(new.telefone,''),'\D','','g');
 if left(tel,2)='55' and length(tel) in (12,13) then tel:=substr(tel,3); end if;
 nome_cliente:=nullif(btrim(new.nome),'');
 if length(tel) not between 10 and 11 or nome_cliente is null then return new; end if;
 update public.whatsapp_conversas w
   set nome=nome_cliente
 where right(regexp_replace(coalesce(w.telefone,''),'\D','','g'),length(tel))=tel
   and (w.nome is null or btrim(w.nome)='' or w.nome~'^[+0-9 ()-]+$');
 return new;
end;
$$;
drop trigger if exists perfis_sincronizar_nome_whatsapp on public.profiles;
create trigger perfis_sincronizar_nome_whatsapp after insert or update of nome,telefone
on public.profiles for each row execute function public.sincronizar_nome_whatsapp_cliente();
drop trigger if exists leads_sincronizar_nome_whatsapp on public.sorteio_leads;
create trigger leads_sincronizar_nome_whatsapp after insert or update of nome,telefone
on public.sorteio_leads for each row execute function public.sincronizar_nome_whatsapp_cliente();

-- Atualizar conversas preexistentes onde aparecia somente o numero.
update public.whatsapp_conversas w set nome=p.nome
from public.profiles p
where nullif(btrim(p.nome),'') is not null
and length(regexp_replace(coalesce(p.telefone,''),'\D','','g'))>=10
and right(regexp_replace(coalesce(w.telefone,''),'\D','','g'),11)=right(regexp_replace(p.telefone,'\D','','g'),11)
and (w.nome is null or btrim(w.nome)='' or w.nome~'^[+0-9 ()-]+$');

-- Lista unificada e deduplicada por telefone, para consulta administrativa.
create or replace function public.clientes_campanhas_por_cidade()
returns table(nome text,telefone text,cidade text,email text,marketing_autorizado boolean)
language plpgsql security definer set search_path to ''
as $$
begin
 if not public.has_role((select auth.uid()),'admin'::public.app_role) then
   raise exception 'Acesso administrativo obrigatorio' using errcode='42501';
 end if;
 return query
 with fonte as (
  select coalesce(nullif(btrim(p.nome),''),'Cliente') as n,
   right(regexp_replace(coalesce(p.telefone,''),'\D','','g'),11) as tel,
   nullif(btrim(p.cidade),'') as cid,
   u.email::text as mail,
   coalesce(l.optin_marketing,false) as consent,
   1 as prioridade
   from public.profiles p
   left join auth.users u on u.id=p.id
   left join public.sorteio_leads l on l.telefone=right(regexp_replace(coalesce(p.telefone,''),'\D','','g'),11)
  union all
  select l.nome, l.telefone, p.cidade, u.email::text, l.optin_marketing, 2
  from public.sorteio_leads l
  left join public.profiles p on p.id=l.user_id
  left join auth.users u on u.id=l.user_id
 )
 select distinct on(f.tel) f.n,f.tel,f.cid,f.mail,f.consent
 from fonte f where length(f.tel) between 10 and 11
 order by f.tel,f.prioridade;
end;
$$;
revoke all on function public.clientes_campanhas_por_cidade() from public;
grant execute on function public.clientes_campanhas_por_cidade() to authenticated;
