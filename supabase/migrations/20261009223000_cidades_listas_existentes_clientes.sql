create or replace function public.clientes_campanhas_por_cidade()
returns table(nome text,telefone text,cidade text,email text,marketing_autorizado boolean)
language plpgsql security definer set search_path to ''
as $$
begin
 if not public.has_role((select auth.uid()),'admin'::public.app_role) then
   raise exception 'Acesso administrativo obrigatorio' using errcode='42501';
 end if;
 return query
 with cidades_listas as (
   select right(regexp_replace(coalesce(c.telefone,''),'\D','','g'),11) as tel,
     min(case lower(btrim(l.nome))
       when 'pien' then 'Piên'
       when 'piên' then 'Piên'
       when 'rio negrinho' then 'Rio Negrinho'
       when 'campo alegre' then 'Campo Alegre'
       when 'mafra' then 'Mafra'
       when 'são bento do sul' then 'São Bento do Sul'
       when 'sao bento do sul' then 'São Bento do Sul'
       when 'corupá' then 'Corupá'
       when 'corupa' then 'Corupá'
       else null end) as cid
   from public.contatos_lista c join public.listas_contatos l on l.id=c.lista_id
   group by 1
 ),
 fontes as (
  select coalesce(nullif(btrim(p.nome),''),'Cliente') as n,
   right(regexp_replace(coalesce(p.telefone,''),'\D','','g'),11) as tel,
   coalesce(nullif(btrim(p.cidade),''),cl.cid) as cid,
   u.email::text as mail,
   coalesce(sl.optin_marketing,false) as consent,
   1 as prioridade
   from public.profiles p
   left join auth.users u on u.id=p.id
   left join cidades_listas cl on cl.tel=right(regexp_replace(coalesce(p.telefone,''),'\D','','g'),11)
   left join public.sorteio_leads sl on sl.telefone=right(regexp_replace(coalesce(p.telefone,''),'\D','','g'),11)
  union all
  select sl.nome,sl.telefone,coalesce(nullif(btrim(p.cidade),''),cl.cid),
    u.email::text,sl.optin_marketing,2
   from public.sorteio_leads sl
   left join public.profiles p on p.id=sl.user_id
   left join auth.users u on u.id=sl.user_id
   left join cidades_listas cl on cl.tel=sl.telefone
  union all
  select coalesce(nullif(btrim(c.nome),''),'Cliente'),right(regexp_replace(c.telefone,'\D','','g'),11),
    cl.cid,c.email::text,false,3
   from public.contatos_lista c
   join cidades_listas cl on cl.tel=right(regexp_replace(c.telefone,'\D','','g'),11)
   where cl.cid is not null
 )
 select distinct on (f.tel) f.n,f.tel,f.cid,f.mail,f.consent
 from fontes f where length(f.tel) between 10 and 11
 order by f.tel,f.prioridade;
end;
$$;
