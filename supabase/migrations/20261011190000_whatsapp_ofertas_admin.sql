create or replace function public.listar_whatsapp_ofertas_admin()
returns table(telefone text,nome text,consentido_em timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.has_role((select auth.uid()),'admin'::public.app_role) then
    raise exception 'Acesso administrativo obrigatório' using errcode='42501';
  end if;
  return query
    select o.telefone,coalesce(o.nome,'')::text,o.consentido_em
    from public.whatsapp_ofertas_optins o
    where o.consentimento is true
    order by o.consentido_em desc nulls last limit 1000;
end;
$$;

create or replace function public.revogar_whatsapp_ofertas_admin(p_telefone text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.has_role((select auth.uid()),'admin'::public.app_role) then
    raise exception 'Acesso administrativo obrigatório' using errcode='42501';
  end if;
  update public.whatsapp_ofertas_optins
    set consentimento=false,revogado_em=now(),atualizado_em=now()
  where telefone=regexp_replace(coalesce(p_telefone,''),'[^0-9]','','g')
    and consentimento is true;
  return found;
end;
$$;

revoke all on function public.listar_whatsapp_ofertas_admin() from public;
revoke all on function public.revogar_whatsapp_ofertas_admin(text) from public;
grant execute on function public.listar_whatsapp_ofertas_admin() to authenticated;
grant execute on function public.revogar_whatsapp_ofertas_admin(text) to authenticated;
